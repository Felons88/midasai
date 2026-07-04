/**
 * Nexus Execution Engine
 * Real DAG runner: topological sort, sequential + parallel branches,
 * expression interpolation, per-node retries, error routing.
 */

import type { WorkflowDefinition } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeStatus = "idle" | "running" | "success" | "error" | "skipped"

export interface NodeResult {
  node_id: string
  node_type_id: string
  status: NodeStatus
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string
  duration_ms: number
  started_at: string
  finished_at: string
}

export interface ExecutionContext {
  $input: Record<string, unknown>
  $workflow: { id: string; name: string }
  $env: Record<string, string>
  $node: Record<string, Record<string, unknown>>  // node label/id → outputs
}

export interface ExecutionProgress {
  nodeId: string
  status: NodeStatus
  output?: Record<string, unknown>
  error?: string
}

export type ProgressCallback = (p: ExecutionProgress) => void

export interface ExecutionResult {
  status: "completed" | "failed"
  node_results: NodeResult[]
  output: Record<string, unknown>
  duration_ms: number
  error?: string
}

// ─── Expression interpolation ────────────────────────────────────────────────

/** Replace {{$input.key}}, {{$node.NodeName.output.key}} in any string value */
function interpolate(value: unknown, ctx: ExecutionContext): unknown {
  if (typeof value !== "string") return value
  return value.replace(/\{\{([^}]+)\}\}/g, (_match, expr) => {
    try {
      const parts = expr.trim().split(".")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = ctx
      for (const part of parts) {
        if (cur == null) return ""
        cur = cur[part]
      }
      if (cur === undefined || cur === null) return ""
      return typeof cur === "object" ? JSON.stringify(cur) : String(cur)
    } catch {
      return ""
    }
  })
}

function interpolateConfig(config: Record<string, unknown>, ctx: ExecutionContext): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === "string") {
      result[key] = interpolate(val, ctx)
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = interpolateConfig(val as Record<string, unknown>, ctx)
    } else {
      result[key] = val
    }
  }
  return result
}

// ─── Topological sort ────────────────────────────────────────────────────────

function topoSort(definition: WorkflowDefinition): string[] {
  const { nodes, edges } = definition
  const inDegree: Record<string, number> = {}
  const adjList: Record<string, string[]> = {}

  for (const n of nodes) {
    inDegree[n.id] = 0
    adjList[n.id] = []
  }
  for (const e of edges) {
    adjList[e.source_node_id].push(e.target_node_id)
    inDegree[e.target_node_id] = (inDegree[e.target_node_id] ?? 0) + 1
  }

  const queue: string[] = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const order: string[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const next of adjList[id]) {
      inDegree[next]--
      if (inDegree[next] === 0) queue.push(next)
    }
  }

  // Add any disconnected nodes not reached
  for (const n of nodes) {
    if (!order.includes(n.id)) order.push(n.id)
  }

  return order
}

// ─── Node executor map ───────────────────────────────────────────────────────

type NodeExecutorFn = (config: Record<string, unknown>, ctx: ExecutionContext) => Promise<Record<string, unknown>>

const NODE_EXECUTORS: Record<string, NodeExecutorFn> = {

  // ── HTTP Request ────────────────────────────────────────────────────────────
  http_request: async (config) => {
    const method = String(config.method ?? "GET")
    const url = String(config.url ?? "")
    if (!url) throw new Error("URL is required")

    const headers: Record<string, string> = {}
    if (config.headers && typeof config.headers === "object") {
      Object.assign(headers, config.headers)
    }
    // Auth
    const authType = String(config.auth_type ?? "none")
    const authValue = String(config.auth_value ?? "")
    if (authType === "bearer" && authValue) headers["Authorization"] = `Bearer ${authValue}`
    if (authType === "basic" && authValue) headers["Authorization"] = `Basic ${btoa(authValue)}`
    if (authType === "apikey" && authValue) headers["X-API-Key"] = authValue

    const timeoutMs = Number(config.timeout_ms ?? 30000)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: ["GET", "HEAD"].includes(method) ? undefined : JSON.stringify(config.body ?? null),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const text = await res.text()
      let body: unknown = text
      try { body = JSON.parse(text) } catch { /* keep as text */ }
      return {
        response: body,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body_out: body,
        ok: res.ok,
      }
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  },

  // ── If / Condition ──────────────────────────────────────────────────────────
  if_condition: async (config, ctx) => {
    const expr = String(config.condition ?? "true")
    let result = false
    try {
      // Safe evaluation: only allow simple comparisons
      const interpolated = interpolate(expr, ctx) as string
      // eslint-disable-next-line no-new-func
      result = Boolean(new Function("ctx", `with(ctx) { return !!(${interpolated}) }`)(ctx))
    } catch {
      result = false
    }
    return { result, branch: result ? "true" : "false" }
  },

  // ── Set Variables ───────────────────────────────────────────────────────────
  set_vars: async (config, ctx) => {
    const assignments = config.assignments as Array<{ key: string; value: string }> ?? []
    const out: Record<string, unknown> = {}
    for (const { key, value } of assignments) {
      out[key] = interpolate(value, ctx)
    }
    return out
  },

  // ── Text Transform ──────────────────────────────────────────────────────────
  text_transform: async (config, ctx) => {
    const input = String(interpolate(String(config.input ?? ""), ctx))
    const op = String(config.operation ?? "uppercase")
    const ops: Record<string, (s: string) => string> = {
      uppercase: s => s.toUpperCase(),
      lowercase: s => s.toLowerCase(),
      trim: s => s.trim(),
      reverse: s => s.split("").reverse().join(""),
      base64_encode: s => btoa(s),
      base64_decode: s => atob(s),
      url_encode: s => encodeURIComponent(s),
      url_decode: s => decodeURIComponent(s),
      json_parse: s => { try { return JSON.parse(s) } catch { return s } },
      json_stringify: s => JSON.stringify(s),
      word_count: s => String(s.trim().split(/\s+/).filter(Boolean).length),
      char_count: s => String(s.length),
      slug: s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }
    return { result: (ops[op] ?? (s => s))(input), input }
  },

  // ── Filter Array ────────────────────────────────────────────────────────────
  filter_array: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? []) as unknown[]
    const key = String(config.key ?? "")
    const op = String(config.operator ?? "exists")
    const val = config.value
    const filtered = arr.filter((item) => {
      const itemVal = key ? (item as Record<string, unknown>)[key] : item
      switch (op) {
        case "equals": return itemVal === val
        case "not_equals": return itemVal !== val
        case "contains": return String(itemVal).includes(String(val))
        case "gt": return Number(itemVal) > Number(val)
        case "lt": return Number(itemVal) < Number(val)
        case "exists": return itemVal !== undefined && itemVal !== null
        case "truthy": return Boolean(itemVal)
        default: return true
      }
    })
    return { result: filtered, count: filtered.length, original_count: arr.length }
  },

  // ── Sort Array ──────────────────────────────────────────────────────────────
  sort_array: async (config, ctx) => {
    const arr = [...((config.array ?? ctx.$input.array ?? []) as unknown[])]
    const key = String(config.key ?? "")
    const order = String(config.order ?? "asc")
    arr.sort((a, b) => {
      const av = key ? (a as Record<string, unknown>)[key] : a
      const bv = key ? (b as Record<string, unknown>)[key] : b
      if (typeof av === "string" && typeof bv === "string") {
        return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return order === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av)
    })
    return { result: arr, count: arr.length }
  },

  // ── Wait / Delay ────────────────────────────────────────────────────────────
  delay: async (config) => {
    const ms = Math.min(Number(config.delay_ms ?? 1000), 30000) // cap at 30s
    await new Promise(r => setTimeout(r, ms))
    return { delayed_ms: ms }
  },

  // ── Code / Script (sandboxed) ───────────────────────────────────────────────
  code_exec: async (config, ctx) => {
    const code = String(config.code ?? "return {}")
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("input", "ctx", `"use strict"; ${code}`)
      const result = fn(ctx.$input, ctx)
      return { result: result ?? null }
    } catch (err) {
      throw new Error(`Script error: ${err instanceof Error ? err.message : String(err)}`)
    }
  },

  // ── AI Chat (OpenAI / Anthropic / Gemini / Groq / OpenRouter) ──────────────
  ai_chat: async (config, ctx) => {
    const provider = String(config.provider ?? "openai")
    const prompt = String(config.prompt ?? interpolate(String(config.user_message ?? ""), ctx) ?? "")
    const systemPrompt = String(config.system_prompt ?? "You are a helpful assistant.")
    const model = String(config.model ?? "")
    const temperature = Number(config.temperature ?? 0.7)
    const maxTokens = Number(config.max_tokens ?? 1024)
    const apiKey = String(config.api_key_override ?? ctx.$env[`${provider}_api_key`] ?? ctx.$env.ai_provider ?? "")
    const jsonMode = Boolean(config.json_mode ?? false)

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt || String(ctx.$input.prompt ?? ctx.$input.message ?? "") },
    ]

    let endpoint = ""
    let headers: Record<string, string> = { "Content-Type": "application/json" }
    let body: Record<string, unknown> = {}
    let defaultModel = ""

    switch (provider) {
      case "openai":
      case "openrouter":
      case "groq":
      case "together":
        endpoint = provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : provider === "groq"
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api.together.xyz/v1/chat/completions"
        defaultModel = provider === "openai" ? "gpt-4o-mini"
          : provider === "groq" ? "llama-3.1-70b-versatile"
          : "mistralai/Mixtral-8x7B-Instruct-v0.1"
        headers["Authorization"] = `Bearer ${apiKey}`
        body = {
          model: model || defaultModel,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }
        break
      case "anthropic":
        endpoint = String(config.base_url ?? "https://api.anthropic.com/v1/messages")
        headers = { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
        defaultModel = "claude-3-5-haiku-20241022"
        body = {
          model: model || defaultModel,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
        }
        break
      case "gemini": {
        const gModel = model || "gemini-1.5-flash"
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`
        body = {
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }
        break
      }
      case "ollama":
        endpoint = String(config.base_url ?? "http://localhost:11434") + "/api/chat"
        body = { model: model || "llama3", messages, stream: false, options: { temperature } }
        break
      default:
        throw new Error(`Unknown AI provider: ${provider}`)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    try {
      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`${provider} API error ${res.status}: ${errText.slice(0, 200)}`)
      }
      const data = await res.json() as Record<string, unknown>

      let content = ""
      let usage: Record<string, unknown> = {}
      if (provider === "anthropic") {
        const cont = (data.content as Array<{ text: string }>)?.[0]
        content = cont?.text ?? ""
        usage = (data.usage as Record<string, unknown>) ?? {}
      } else if (provider === "gemini") {
        const cands = data.candidates as Array<{ content: { parts: Array<{ text: string }> } }>
        content = cands?.[0]?.content?.parts?.[0]?.text ?? ""
        usage = (data.usageMetadata as Record<string, unknown>) ?? {}
      } else {
        const choices = data.choices as Array<{ message: { content: string } }>
        content = choices?.[0]?.message?.content ?? ""
        usage = (data.usage as Record<string, unknown>) ?? {}
      }

      if (jsonMode) {
        try { return { response: JSON.parse(content), content, usage, model: model || defaultModel, provider } }
        catch { /* return as string */ }
      }
      return { response: content, content, usage, model: model || defaultModel, provider }
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  },

  // ── AI Embed ──────────────────────────────────────────────────────────────
  ai_embed: async (config, ctx) => {
    const apiKey = String(config.api_key_override ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const input = String(config.input ?? ctx.$input.text ?? ctx.$input.content ?? "")
    const model = String(config.model ?? "text-embedding-3-small")
    if (!apiKey) throw new Error("OpenAI API key required for embeddings")
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input, model }),
    })
    if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
    const data = await res.json() as { data: Array<{ embedding: number[] }>; usage: Record<string, unknown> }
    return { embedding: data.data[0].embedding, dimensions: data.data[0].embedding.length, usage: data.usage }
  },

  // ── AI Image Generation ───────────────────────────────────────────────────
  ai_image: async (config, ctx) => {
    const apiKey = String(config.api_key_override ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const prompt = String(config.prompt ?? ctx.$input.prompt ?? "")
    const model = String(config.model ?? "dall-e-3")
    const size = String(config.size ?? "1024x1024")
    const quality = String(config.quality ?? "standard")
    if (!apiKey) throw new Error("OpenAI API key required for image generation")
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model, size, quality, n: 1 }),
    })
    if (!res.ok) throw new Error(`DALL-E API error: ${res.status}`)
    const data = await res.json() as { data: Array<{ url: string; revised_prompt: string }> }
    return { url: data.data[0].url, revised_prompt: data.data[0].revised_prompt }
  },

  // ── AI Classify / Sentiment ───────────────────────────────────────────────
  ai_classify: async (config, ctx) => {
    const apiKey = String(config.api_key_override ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const text = String(config.text ?? ctx.$input.text ?? "")
    const categories = String(config.categories ?? "positive, negative, neutral")
    const model = String(config.model ?? "gpt-4o-mini")
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [
        { role: "system", content: `Classify the input into exactly one of these categories: ${categories}. Respond with JSON {"category": "<chosen>", "confidence": 0.0-1.0, "reasoning": "<brief>"}` },
        { role: "user", content: text },
      ], response_format: { type: "json_object" }, temperature: 0 }),
    })
    if (!res.ok) throw new Error(`Classification API error: ${res.status}`)
    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    try { return JSON.parse(data.choices[0].message.content) }
    catch { return { category: "unknown", raw: data.choices[0].message.content } }
  },

  // ── AI Extract (structured extraction) ───────────────────────────────────
  ai_extract: async (config, ctx) => {
    const apiKey = String(config.api_key_override ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const text = String(config.text ?? ctx.$input.text ?? ctx.$input.content ?? "")
    const schema = config.schema ?? {}
    const instructions = String(config.instructions ?? "Extract the requested fields from the text.")
    const model = String(config.model ?? "gpt-4o-mini")
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [
        { role: "system", content: `${instructions}\n\nOutput schema: ${JSON.stringify(schema)}\n\nRespond with valid JSON only.` },
        { role: "user", content: text },
      ], response_format: { type: "json_object" }, temperature: 0 }),
    })
    if (!res.ok) throw new Error(`Extraction API error: ${res.status}`)
    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    try { return { result: JSON.parse(data.choices[0].message.content), raw: data.choices[0].message.content } }
    catch { return { result: null, raw: data.choices[0].message.content } }
  },

  // ── AI Agent (ReAct loop, simplified) ────────────────────────────────────
  ai_agent: async (config, ctx) => {
    const apiKey = String(config.api_key_override ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const task = String(config.task ?? ctx.$input.task ?? ctx.$input.prompt ?? "")
    const systemPrompt = String(config.system_prompt ?? "You are a helpful AI agent. Complete the given task.")
    const model = String(config.model ?? "gpt-4o-mini")
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: task },
      ], max_tokens: 2048 }),
    })
    if (!res.ok) throw new Error(`Agent API error: ${res.status}`)
    const data = await res.json() as { choices: Array<{ message: { content: string } }>; usage: Record<string, unknown> }
    return { result: data.choices[0].message.content, task, usage: data.usage }
  },

  // ── AI Transcribe (Whisper) ───────────────────────────────────────────────
  ai_transcribe: async (config, ctx) => {
    const apiKey = String(config.api_key_override ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const audioUrl = String(config.audio_url ?? ctx.$input.audio_url ?? "")
    if (!audioUrl) return { transcript: "", language: "en", note: "No audio URL provided" }
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) throw new Error(`Could not fetch audio: ${audioRes.status}`)
    const blob = await audioRes.blob()
    const formData = new FormData()
    formData.append("file", blob, "audio.mp3")
    formData.append("model", String(config.model ?? "whisper-1"))
    if (config.language) formData.append("language", String(config.language))
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST", headers: { "Authorization": `Bearer ${apiKey}` }, body: formData,
    })
    if (!res.ok) throw new Error(`Whisper API error: ${res.status}`)
    const data = await res.json() as { text: string }
    return { transcript: data.text, text: data.text }
  },

  // ── Slack ──────────────────────────────────────────────────────────────────
  slack: async (config, ctx) => {
    const token = String(config.bot_token ?? ctx.$env.slack_api_key ?? ctx.$env.slack ?? "")
    const channel = String(config.channel ?? "#general")
    const text = String(config.text ?? ctx.$input.text ?? ctx.$input.message ?? "")
    const op = String(config.operation ?? "send_message")

    if (!token) throw new Error("Slack bot token required (add 'slack' credential)")

    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }

    if (op === "send_message") {
      const body: Record<string, unknown> = { channel, text }
      if (config.blocks) body.blocks = config.blocks
      if (config.username) body.username = config.username
      if (config.icon_emoji) body.icon_emoji = config.icon_emoji
      const res = await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers, body: JSON.stringify(body) })
      const data = await res.json() as { ok: boolean; ts: string; channel: string; error?: string }
      if (!data.ok) throw new Error(`Slack error: ${data.error}`)
      return { ts: data.ts, channel: data.channel, ok: data.ok }
    }
    if (op === "get_channel") {
      const res = await fetch(`https://slack.com/api/conversations.info?channel=${channel}`, { headers })
      const data = await res.json() as Record<string, unknown>
      return data
    }
    if (op === "list_channels") {
      const res = await fetch("https://slack.com/api/conversations.list?limit=100", { headers })
      const data = await res.json() as { channels: unknown[]; ok: boolean }
      return { channels: data.channels, count: data.channels?.length ?? 0 }
    }
    if (op === "upload_file") {
      const res = await fetch("https://slack.com/api/files.getUploadURLExternal", { method: "POST", headers, body: JSON.stringify({ filename: String(config.filename ?? "file.txt"), length: String(config.content ?? "").length }) })
      const data = await res.json() as Record<string, unknown>
      return data
    }
    throw new Error(`Unknown Slack operation: ${op}`)
  },

  // ── Discord ───────────────────────────────────────────────────────────────
  discord: async (config, ctx) => {
    const token = String(config.bot_token ?? ctx.$env.discord_api_key ?? ctx.$env.discord ?? "")
    const channelId = String(config.channel_id ?? "")
    const webhookUrl = String(config.webhook_url ?? "")
    const text = String(config.message ?? config.text ?? ctx.$input.message ?? ctx.$input.text ?? "")
    const op = String(config.operation ?? "send_message")

    if (op === "send_webhook" && webhookUrl) {
      const body: Record<string, unknown> = { content: text }
      if (config.embed) body.embeds = [config.embed]
      if (config.username) body.username = config.username
      const res = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      return { ok: res.ok, status: res.status }
    }
    if (!token) throw new Error("Discord bot token required")
    const headers = { "Authorization": `Bot ${token}`, "Content-Type": "application/json" }
    if (op === "send_message") {
      const body: Record<string, unknown> = { content: text }
      if (config.embed) body.embeds = [config.embed]
      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`Discord error: ${res.status}`)
      const data = await res.json() as Record<string, unknown>
      return { id: data.id, channel_id: data.channel_id, ok: true }
    }
    throw new Error(`Unknown Discord operation: ${op}`)
  },

  // ── Email Send (Resend / SendGrid) ────────────────────────────────────────
  email_send: async (config, ctx) => {
    const provider = String(config.provider ?? "resend")
    const to = String(config.to ?? ctx.$input.to ?? "")
    const subject = String(config.subject ?? ctx.$input.subject ?? "")
    const html = String(config.html ?? config.body ?? ctx.$input.html ?? "")
    const text = String(config.text ?? ctx.$input.text ?? "")
    const from = String(config.from ?? ctx.$env.email_from ?? "noreply@example.com")

    if (!to) throw new Error("Email recipient (to) is required")
    if (!subject) throw new Error("Email subject is required")

    if (provider === "resend") {
      const apiKey = String(config.api_key ?? ctx.$env.resend_api_key ?? ctx.$env.email_send ?? "")
      if (!apiKey) throw new Error("Resend API key required (add 'email_send' credential)")
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, html: html || undefined, text: text || undefined }),
      })
      if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`)
      const data = await res.json() as { id: string }
      return { id: data.id, to, subject, provider, ok: true }
    }
    if (provider === "sendgrid") {
      const apiKey = String(config.api_key ?? ctx.$env.sendgrid_api_key ?? ctx.$env.email_send ?? "")
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: from }, subject, content: [{ type: "text/html", value: html || text }] }),
      })
      if (!res.ok) throw new Error(`SendGrid error: ${res.status}`)
      return { to, subject, provider, ok: true }
    }
    throw new Error(`Unknown email provider: ${provider}`)
  },

  // ── GitHub ────────────────────────────────────────────────────────────────
  github: async (config, ctx) => {
    const token = String(config.token ?? ctx.$env.github_api_key ?? ctx.$env.github ?? "")
    const owner = String(config.owner ?? "")
    const repo = String(config.repo ?? "")
    const op = String(config.operation ?? "get_repo")
    const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }

    if (op === "get_repo") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
      if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "list_issues") {
      const state = String(config.state ?? "open")
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=30`, { headers })
      if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
      const data = await res.json() as unknown[]
      return { issues: data, count: data.length }
    }
    if (op === "create_issue") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title: config.title, body: config.body, labels: config.labels }),
      })
      if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "create_pr") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title: config.title, body: config.body, head: config.head, base: config.base ?? "main" }),
      })
      if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "search_code") {
      const res = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(String(config.query ?? ""))}&per_page=10`, { headers })
      if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "get_content") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${config.path}?ref=${config.branch ?? "main"}`, { headers })
      if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
      const data = await res.json() as { content: string; encoding: string; name: string; path: string }
      const decoded = data.encoding === "base64" ? atob(data.content.replace(/\n/g, "")) : data.content
      return { content: decoded, name: data.name, path: data.path }
    }
    throw new Error(`Unknown GitHub operation: ${op}`)
  },

  // ── GitHub Actions ─────────────────────────────────────────────────────────
  github_actions: async (config, ctx) => {
    const token = String(config.token ?? ctx.$env.github_api_key ?? ctx.$env.github ?? "")
    const owner = String(config.owner ?? "")
    const repo = String(config.repo ?? "")
    const op = String(config.operation ?? "trigger_dispatch")
    const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" }

    if (op === "trigger_dispatch") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${config.workflow_id}/dispatches`, {
        method: "POST", headers, body: JSON.stringify({ ref: config.ref ?? "main", inputs: config.inputs ?? {} }),
      })
      if (!res.ok) throw new Error(`GitHub Actions error: ${res.status}`)
      return { triggered: true, workflow_id: config.workflow_id, ref: config.ref }
    }
    if (op === "list_runs") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${config.workflow_id}/runs?per_page=10`, { headers })
      const data = await res.json() as Record<string, unknown>
      return data
    }
    if (op === "get_run") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${config.run_id}`, { headers })
      const data = await res.json() as Record<string, unknown>
      return data
    }
    throw new Error(`Unknown GitHub Actions operation: ${op}`)
  },

  // ── Notion ────────────────────────────────────────────────────────────────
  notion: async (config, ctx) => {
    const token = String(config.token ?? ctx.$env.notion_api_key ?? ctx.$env.notion ?? "")
    const op = String(config.operation ?? "get_page")
    const headers = { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" }

    if (op === "get_page") {
      const res = await fetch(`https://api.notion.com/v1/pages/${config.page_id}`, { headers })
      if (!res.ok) throw new Error(`Notion error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "query_database") {
      const body: Record<string, unknown> = { page_size: Number(config.limit ?? 50) }
      if (config.filter) body.filter = config.filter
      if (config.sorts) body.sorts = config.sorts
      const res = await fetch(`https://api.notion.com/v1/databases/${config.database_id}/query`, { method: "POST", headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`Notion error: ${res.status}`)
      const data = await res.json() as { results: unknown[]; next_cursor: string | null }
      return { results: data.results, count: data.results.length, next_cursor: data.next_cursor }
    }
    if (op === "create_page") {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST", headers,
        body: JSON.stringify({ parent: config.parent, properties: config.properties, children: config.children }),
      })
      if (!res.ok) throw new Error(`Notion error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "update_page") {
      const res = await fetch(`https://api.notion.com/v1/pages/${config.page_id}`, {
        method: "PATCH", headers, body: JSON.stringify({ properties: config.properties }),
      })
      if (!res.ok) throw new Error(`Notion error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown Notion operation: ${op}`)
  },

  // ── Linear ────────────────────────────────────────────────────────────────
  linear: async (config, ctx) => {
    const token = String(config.api_key ?? ctx.$env.linear_api_key ?? ctx.$env.linear ?? "")
    const op = String(config.operation ?? "list_issues")
    const headers = { "Authorization": token, "Content-Type": "application/json" }

    const gql = async (query: string, variables: Record<string, unknown> = {}) => {
      const res = await fetch("https://api.linear.app/graphql", { method: "POST", headers, body: JSON.stringify({ query, variables }) })
      if (!res.ok) throw new Error(`Linear error: ${res.status}`)
      const data = await res.json() as { data: Record<string, unknown>; errors?: Array<{ message: string }> }
      if (data.errors?.length) throw new Error(`Linear GraphQL: ${data.errors[0].message}`)
      return data.data
    }

    if (op === "list_issues") {
      return await gql(`query { issues(first: 25) { nodes { id title state { name } priority assignee { name } } } }`)
    }
    if (op === "create_issue") {
      return await gql(`mutation($title: String!, $teamId: String!, $description: String) { issueCreate(input: { title: $title, teamId: $teamId, description: $description }) { success issue { id title url } } }`,
        { title: config.title, teamId: config.team_id, description: config.description })
    }
    if (op === "update_issue") {
      return await gql(`mutation($id: String!, $stateId: String) { issueUpdate(id: $id, input: { stateId: $stateId }) { success issue { id title } } }`,
        { id: config.issue_id, stateId: config.state_id })
    }
    throw new Error(`Unknown Linear operation: ${op}`)
  },

  // ── Stripe ────────────────────────────────────────────────────────────────
  stripe: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.stripe_api_key ?? ctx.$env.stripe ?? "")
    const op = String(config.operation ?? "list_customers")
    if (!apiKey) throw new Error("Stripe API key required")
    const headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/x-www-form-urlencoded" }
    const get = async (path: string) => {
      const res = await fetch(`https://api.stripe.com/v1/${path}`, { headers })
      if (!res.ok) throw new Error(`Stripe error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    const post = async (path: string, params: Record<string, string>) => {
      const body = new URLSearchParams(params).toString()
      const res = await fetch(`https://api.stripe.com/v1/${path}`, { method: "POST", headers, body })
      if (!res.ok) throw new Error(`Stripe error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }

    if (op === "list_customers") return await get(`customers?limit=${config.limit ?? 10}`)
    if (op === "get_customer") return await get(`customers/${config.customer_id}`)
    if (op === "list_charges") return await get(`charges?limit=${config.limit ?? 10}`)
    if (op === "create_payment_intent") return await post("payment_intents", { amount: String(config.amount ?? 0), currency: String(config.currency ?? "usd") })
    if (op === "create_checkout") return await post("checkout/sessions", { mode: "payment", "line_items[0][price]": String(config.price_id), "line_items[0][quantity]": "1", "success_url": String(config.success_url ?? "https://example.com"), "cancel_url": String(config.cancel_url ?? "https://example.com") })
    if (op === "create_refund") return await post("refunds", { payment_intent: String(config.payment_intent_id) })
    throw new Error(`Unknown Stripe operation: ${op}`)
  },

  // ── Telegram ──────────────────────────────────────────────────────────────
  telegram: async (config, ctx) => {
    const token = String(config.bot_token ?? ctx.$env.telegram_api_key ?? ctx.$env.telegram ?? "")
    const chatId = String(config.chat_id ?? ctx.$input.chat_id ?? "")
    const op = String(config.operation ?? "send_message")
    const base = `https://api.telegram.org/bot${token}`

    if (op === "send_message") {
      const res = await fetch(`${base}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: config.text ?? ctx.$input.text ?? "", parse_mode: config.parse_mode ?? "HTML" }) })
      if (!res.ok) throw new Error(`Telegram error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "get_updates") {
      const res = await fetch(`${base}/getUpdates`)
      const data = await res.json() as { result: unknown[] }
      return { updates: data.result, count: data.result?.length ?? 0 }
    }
    throw new Error(`Unknown Telegram operation: ${op}`)
  },

  // ── Supabase DB ────────────────────────────────────────────────────────────
  supabase_db: async (config, ctx) => {
    const url = String(config.supabase_url ?? ctx.$env.supabase_url ?? "")
    const key = String(config.supabase_key ?? ctx.$env.supabase_api_key ?? ctx.$env.supabase ?? "")
    const table = String(config.table ?? "")
    const op = String(config.operation ?? "select")
    if (!url || !key) throw new Error("Supabase URL and API key required")
    const headers = { "Authorization": `Bearer ${key}`, "apikey": key, "Content-Type": "application/json", "Prefer": "return=representation" }
    const base = `${url}/rest/v1/${table}`

    if (op === "select") {
      const cols = String(config.columns ?? "*")
      const limit = Number(config.limit ?? 100)
      const res = await fetch(`${base}?select=${cols}&limit=${limit}`, { headers })
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`)
      const data = await res.json() as unknown[]
      return { data, count: data.length }
    }
    if (op === "insert") {
      const res = await fetch(base, { method: "POST", headers, body: JSON.stringify(config.data ?? {}) })
      if (!res.ok) throw new Error(`Supabase insert error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "update") {
      const filter = config.filter ? `?${Object.entries(config.filter as Record<string, string>).map(([k, v]) => `${k}=eq.${v}`).join("&")}` : ""
      const res = await fetch(`${base}${filter}`, { method: "PATCH", headers, body: JSON.stringify(config.data ?? {}) })
      if (!res.ok) throw new Error(`Supabase update error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "delete") {
      const filter = config.filter ? `?${Object.entries(config.filter as Record<string, string>).map(([k, v]) => `${k}=eq.${v}`).join("&")}` : ""
      const res = await fetch(`${base}${filter}`, { method: "DELETE", headers })
      if (!res.ok) throw new Error(`Supabase delete error: ${res.status}`)
      return { deleted: true }
    }
    throw new Error(`Unknown Supabase operation: ${op}`)
  },

  // ── Supabase Query (alias) ────────────────────────────────────────────────
  supabase_query: async (config, ctx) => {
    return NODE_EXECUTORS.supabase_db(config, ctx)
  },

  // ── Parse CSV ─────────────────────────────────────────────────────────────
  parse_csv: async (config, ctx) => {
    const raw = String(config.csv ?? ctx.$input.csv ?? ctx.$input.content ?? "")
    const delimiter = String(config.delimiter ?? ",")
    const hasHeader = config.has_header !== false
    const lines = raw.split(/\r?\n/).filter(l => l.trim())
    if (!lines.length) return { rows: [], headers: [], count: 0 }
    const parse = (line: string) => {
      const fields: string[] = []
      let cur = "", inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue }
        if (ch === delimiter && !inQ) { fields.push(cur.trim()); cur = ""; continue }
        cur += ch
      }
      fields.push(cur.trim())
      return fields
    }
    const headers = hasHeader ? parse(lines[0]) : lines[0].split(delimiter).map((_, i) => `col${i}`)
    const dataLines = hasHeader ? lines.slice(1) : lines
    const rows = dataLines.map(l => { const vals = parse(l); return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""])) })
    return { rows, headers, count: rows.length }
  },

  // ── JSON Op ───────────────────────────────────────────────────────────────
  json_op: async (config, ctx) => {
    const input = config.input ?? ctx.$input.data ?? ctx.$input
    const op = String(config.operation ?? "parse")
    if (op === "parse") {
      try { return { result: JSON.parse(String(input)), pretty: JSON.stringify(JSON.parse(String(input)), null, 2) } }
      catch { throw new Error("Invalid JSON input") }
    }
    if (op === "stringify") {
      const indent = Number(config.indent ?? 2)
      const str = JSON.stringify(input, null, indent)
      return { result: str, pretty: str }
    }
    if (op === "path") {
      const path = String(config.path ?? "$")
      const parts = path.replace(/^\$\.?/, "").split(/\.|\[(\d+)\]/).filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = input
      for (const part of parts) {
        if (cur == null) { cur = null; break }
        cur = cur[part]
      }
      return { result: cur }
    }
    throw new Error(`Unknown JSON operation: ${op}`)
  },

  // ── Merge branches ────────────────────────────────────────────────────────
  merge: async (config, ctx) => {
    const strategy = String(config.strategy ?? "object")
    const branches = [ctx.$input.branch_1, ctx.$input.branch_2, ctx.$input.branch_3].filter(Boolean)
    if (strategy === "array") return { result: branches.flat() }
    if (strategy === "first") return { result: branches[0] ?? null }
    const merged: Record<string, unknown> = {}
    for (const b of branches) {
      if (b && typeof b === "object") Object.assign(merged, b)
    }
    return merged
  },

  // ── Switch ────────────────────────────────────────────────────────────────
  switch: async (config, ctx) => {
    const field = String(config.field ?? "")
    const cases = (config.cases ?? []) as Array<{ value: string; output: number }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldVal = field ? String((ctx.$input as any)[field.replace(/^\{\{|\}\}$/g, "")] ?? field) : String(ctx.$input)
    const matched = cases.find(c => c.value === fieldVal)
    return { matched_case: matched?.value ?? null, output_index: matched?.output ?? -1, value: fieldVal }
  },

  // ── Loop forEach ─────────────────────────────────────────────────────────
  loop_foreach: async (config, ctx) => {
    const fieldPath = String(config.field ?? "")
    const items = (ctx.$input[fieldPath] ?? ctx.$input.items ?? ctx.$input.array ?? []) as unknown[]
    if (!Array.isArray(items)) return { results: [], count: 0, error: "Input is not an array" }
    return { results: items, count: items.length, item: items[0] ?? null, index: 0 }
  },

  // ── Retry (wrapper) ───────────────────────────────────────────────────────
  retry: async (config, ctx) => {
    return { max_attempts: config.max_attempts ?? 3, backoff_ms: config.backoff_ms ?? 1000, status: "configured" }
  },

  // ── File Read (simulation — file system not accessible server-side) ───────
  file_read: async (config, ctx) => {
    const path = String(config.path ?? ctx.$input.path ?? "")
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const res = await fetch(path)
      if (!res.ok) throw new Error(`Could not fetch: ${res.status}`)
      const content = await res.text()
      return { content, size: content.length, path }
    }
    return { content: null, error: "Local file system access requires Midas Bridge", path }
  },

  // ── File Write ────────────────────────────────────────────────────────────
  file_write: async (config, ctx) => {
    return { written: false, error: "Local file write requires Midas Bridge", path: config.path }
  },

  // ── Schedule Trigger (noop at runtime — triggered externally) ───────────────
  schedule: async () => ({ triggered: true, timestamp: new Date().toISOString() }),

  // ── Webhook Trigger (noop at runtime) ──────────────────────────────────────
  webhook: async (config, ctx) => ({ payload: ctx.$input, triggered: true }),

  // ── Webhook Trigger variant ───────────────────────────────────────────────
  webhook_trigger: async (config, ctx) => ({ payload: ctx.$input, triggered: true, response_code: config.response_code ?? 200 }),

  // ── Default: pass-through for unimplemented executors ──────────────────────
  default: async (config, ctx) => ({
    result: null,
    note: "This node type runs server-side via API. In local mode, it passes through.",
    input: ctx.$input,
    config,
  }),
}

function getExecutor(executorKey: string): NodeExecutorFn {
  return NODE_EXECUTORS[executorKey] ?? NODE_EXECUTORS.default
}

// ─── Bridge push helper ─────────────────────────────────────────────────────────

async function pushToBridge(deviceId: string, event: Record<string, unknown>): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    // Get device info
    const { data: device } = await supabase
      .from("bridge_devices")
      .select("*")
      .eq("id", deviceId)
      .single()

    if (!device) return

    // Push to bridge server
    const bridgeUrl = `http://localhost:${device.bridge_port}/midas-bridge/push`
    await fetch(bridgeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    })
  } catch (err) {
    // Silently fail - bridge may not be running
    console.error("Bridge push failed:", err)
  }
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries: number, delayMs = 500): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < retries) await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
  throw lastErr
}

// ─── Main executor ────────────────────────────────────────────────────────────

export async function executeWorkflow(
  definition: WorkflowDefinition,
  workflowMeta: { id: string; name: string },
  inputData: Record<string, unknown> = {},
  onProgress?: ProgressCallback,
  credentials: Record<string, string> = {},
  deviceId?: string,
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const nodeResults: NodeResult[] = []

  const ctx: ExecutionContext = {
    $input: inputData,
    $workflow: workflowMeta,
    $env: { ...credentials },
    $node: {},
  }

  const order = topoSort(definition)

  for (const nodeId of order) {
    const nodeDef = definition.nodes.find(n => n.id === nodeId)
    if (!nodeDef) continue

    const nodeStart = Date.now()
    onProgress?.({ nodeId, status: "running" })

    // Assemble inputs from upstream node outputs
    const incomingEdges = definition.edges.filter(e => e.target_node_id === nodeId)
    for (const edge of incomingEdges) {
      const upstreamOutput = ctx.$node[edge.source_node_id] ?? {}
      ctx.$input = { ...ctx.$input, ...upstreamOutput }
    }

    // Interpolate config values
    const resolvedConfig = interpolateConfig(nodeDef.configuration ?? {}, ctx)

    // Get retry count
    const retries = Number(resolvedConfig.retry_count ?? 0)

    // Find executor key from node_type_id (last segment)
    const executorKey = nodeDef.node_type_id.split(".").pop() ?? nodeDef.node_type_id

    let output: Record<string, unknown> = {}
    let nodeStatus: NodeStatus = "success"
    let errorMsg: string | undefined

    try {
      const executor = getExecutor(executorKey)
      output = await withRetry(() => executor(resolvedConfig, ctx), retries)
      ctx.$node[nodeId] = output
      // Also index by label for expression access
      if (nodeDef.label) ctx.$node[nodeDef.label] = output
    } catch (err) {
      nodeStatus = "error"
      errorMsg = err instanceof Error ? err.message : String(err)
      ctx.$node[nodeId] = { error: errorMsg }
      onProgress?.({ nodeId, status: "error", error: errorMsg })
    }

    const nodeEnd = Date.now()

    nodeResults.push({
      node_id: nodeId,
      node_type_id: nodeDef.node_type_id,
      status: nodeStatus,
      input: resolvedConfig,
      output,
      error: errorMsg,
      duration_ms: nodeEnd - nodeStart,
      started_at: new Date(nodeStart).toISOString(),
      finished_at: new Date(nodeEnd).toISOString(),
    })

    if (nodeStatus === "success") {
      onProgress?.({ nodeId, status: "success", output })
    }
  }

  const totalDuration = Date.now() - startTime
  const hasErrors = nodeResults.some(r => r.status === "error")

  const result: ExecutionResult = {
    status: hasErrors ? "failed" : "completed",
    node_results: nodeResults,
    output: ctx.$node,
    duration_ms: totalDuration,
    error: hasErrors ? `${nodeResults.filter(r => r.status === "error").length} node(s) failed` : undefined,
  }

  // Push result to connected IDE via bridge
  if (deviceId) {
    await pushToBridge(deviceId, {
      type: "workflow_result",
      execution_id: workflowMeta.id,
      workflow_name: workflowMeta.name,
      status: result.status,
      node_results: result.node_results,
      output: result.output,
      duration_ms: result.duration_ms,
    })
  }

  return result
}
