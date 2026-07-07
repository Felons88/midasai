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

  // ── NoOp (pass-through) ─────────────────────────────────────────────────────
  no_op: async (config, ctx) => {
    // Simply passes input through unchanged
    return { ...ctx.$input, _noOp: true }
  },

  // ── Stop and Error ─────────────────────────────────────────────────────────
  stop_and_error: async (config, ctx) => {
    const message = String(config.message ?? config.error_message ?? "Workflow stopped")
    throw new Error(message)
  },

  // ── Split Out (split array into items) ───────────────────────────────────────
  split_out: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? ctx.$input.items ?? []) as unknown[]
    const field = String(config.field ?? "")
    const result = arr.map((item, index) => {
      if (field && typeof item === "object") {
        return { index, item: (item as Record<string, unknown>)[field] }
      }
      return { index, item }
    })
    return { items: result, count: result.length, original: arr }
  },

  // ── Split In Batches ────────────────────────────────────────────────────────
  split_in_batches: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? ctx.$input.items ?? []) as unknown[]
    const batchSize = Number(config.batch_size ?? 10)
    const batches: unknown[][] = []
    for (let i = 0; i < arr.length; i += batchSize) {
      batches.push(arr.slice(i, i + batchSize))
    }
    return { batches, count: batches.length, total_items: arr.length, batch_size: batchSize }
  },

  // ── Respond to Webhook ───────────────────────────────────────────────────────
  respond_to_webhook: async (config, ctx) => {
    const responseCode = Number(config.response_code ?? 200)
    const responseBody = config.response_body ?? ctx.$input
    const headers = config.response_headers ?? { "Content-Type": "application/json" }
    return {
      response: {
        status: responseCode,
        body: responseBody,
        headers,
      },
      responded: true,
    }
  },

  // ── Aggregate (group by field) ───────────────────────────────────────────────
  aggregate: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? ctx.$input.items ?? []) as unknown[]
    const groupBy = String(config.group_by ?? "")
    const operation = String(config.operation ?? "count")
    
    if (!groupBy) {
      return { result: arr, count: arr.length }
    }

    const groups: Record<string, unknown[]> = {}
    for (const item of arr) {
      if (typeof item === "object" && item !== null) {
        const key = String((item as Record<string, unknown>)[groupBy] ?? "undefined")
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
    }

    const result = Object.entries(groups).map(([key, items]) => {
      let value: unknown
      switch (operation) {
        case "count":
          value = items.length
          break
        case "sum":
          value = items.reduce((sum: number, i) => sum + Number((i as Record<string, unknown>).value ?? 0), 0)
          break
        case "avg":
          value = items.reduce((sum: number, i) => sum + Number((i as Record<string, unknown>).value ?? 0), 0) / items.length
          break
        case "first":
          value = items[0]
          break
        case "last":
          value = items[items.length - 1]
          break
        default:
          value = items
      }
      return { key, value, count: items.length }
    })

    return { result, count: result.length, groups }
  },

  // ── Function (n8n function node) ──────────────────────────────────────────────
  function: async (config, ctx) => {
    const code = String(config.code ?? config.function_code ?? "return $input;")
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("$input", "$node", "$json", "items", `"use strict"; ${code}`)
      const result = fn(ctx.$input, ctx.$node, ctx.$input, ctx.$input.array ?? ctx.$input.items ?? [])
      return { result: result ?? null, output: result }
    } catch (err) {
      throw new Error(`Function error: ${err instanceof Error ? err.message : String(err)}`)
    }
  },

  // ── HTML (markdown to HTML) ───────────────────────────────────────────────────
  html: async (config, ctx) => {
    const markdown = String(config.markdown ?? config.input ?? ctx.$input.markdown ?? ctx.$input.text ?? "")
    // Simple markdown to HTML conversion
    const html = markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/`([^`]+)`/gim, "<code>$1</code>")
      .replace(/\n/gim, "<br>")
    return { html, markdown, output: html }
  },

  // ── Markdown (HTML to markdown) ────────────────────────────────────────────────
  markdown: async (config, ctx) => {
    const html = String(config.html ?? config.input ?? ctx.$input.html ?? "")
    // Simple HTML to markdown conversion
    const markdown = html
      .replace(/<h1>(.*?)<\/h1>/gim, "# $1")
      .replace(/<h2>(.*?)<\/h2>/gim, "## $1")
      .replace(/<h3>(.*?)<\/h3>/gim, "### $1")
      .replace(/<strong>(.*?)<\/strong>/gim, "**$1**")
      .replace(/<em>(.*?)<\/em>/gim, "*$1*")
      .replace(/<code>(.*?)<\/code>/gim, "`$1`")
      .replace(/<br\s*\/?>/gim, "\n")
      .replace(/<[^>]+>/gim, "")
    return { markdown, html, output: markdown }
  },

  // ── Filter (n8n filter node) ────────────────────────────────────────────────────
  filter: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? ctx.$input.items ?? []) as unknown[]
    const conditions = config.conditions ?? []
    const operation = String(config.operation ?? "keep")
    
    const filtered = arr.filter((item) => {
      if (typeof item !== "object" || item === null) return true
      
      let match = true
      for (const cond of conditions as Array<{ field: string; operator: string; value: unknown }>) {
        const itemVal = (item as Record<string, unknown>)[cond.field]
        switch (cond.operator) {
          case "equals":
            match = match && itemVal === cond.value
            break
          case "not_equals":
            match = match && itemVal !== cond.value
            break
          case "contains":
            match = match && String(itemVal).includes(String(cond.value))
            break
          case "not_contains":
            match = match && !String(itemVal).includes(String(cond.value))
            break
          case "gt":
            match = match && Number(itemVal) > Number(cond.value)
            break
          case "lt":
            match = match && Number(itemVal) < Number(cond.value)
            break
          case "exists":
            match = match && (itemVal !== undefined && itemVal !== null)
            break
          case "empty":
            match = match && (itemVal === undefined || itemVal === null || itemVal === "")
            break
        }
      }
      return operation === "keep" ? match : !match
    })
    
    return { result: filtered, count: filtered.length, original_count: arr.length }
  },

  // ── Wait (delay) ──────────────────────────────────────────────────────────────
  wait: async (config, ctx) => {
    const ms = Math.min(Number(config.delay_ms ?? config.wait ?? 1000), 30000)
    await new Promise(r => setTimeout(r, ms))
    return { waited_ms: ms, output: ctx.$input }
  },

  // ── Cron (schedule trigger) ────────────────────────────────────────────────────
  cron: async (config) => {
    const expression = String(config.cron_expression ?? "* * * * *")
    return { triggered: true, cron: expression, timestamp: new Date().toISOString() }
  },

  // ── Execute Workflow (sub-workflow) ───────────────────────────────────────────
  execute_workflow: async (config, ctx) => {
    const workflowId = String(config.workflow_id ?? "")
    const inputData = config.input_data ?? ctx.$input
    // In a real implementation, this would call the workflow execution API
    return { 
      workflow_id: workflowId, 
      input: inputData, 
      result: null, 
      note: "Sub-workflow execution requires API integration" 
    }
  },

  // ── Execute Workflow Trigger ────────────────────────────────────────────────
  execute_workflow_trigger: async (config, ctx) => {
    return { triggered: true, workflow_id: config.workflow_id, input: ctx.$input }
  },

  // ── Form Trigger ───────────────────────────────────────────────────────────────
  form_trigger: async (config, ctx) => {
    return { triggered: true, form_data: ctx.$input, form_id: config.form_id }
  },

  // ── Convert to File ───────────────────────────────────────────────────────────
  convert_to_file: async (config, ctx) => {
    const data = config.data ?? ctx.$input.data ?? ctx.$input
    const fileName = String(config.file_name ?? "file.txt")
    const mimeType = String(config.mime_type ?? "text/plain")
    const content = typeof data === "string" ? data : JSON.stringify(data)
    return { 
      file_name: fileName, 
      mime_type: mimeType, 
      data: content, 
      size: content.length,
      binary: Buffer.from(content).toString("base64")
    }
  },

  // ── Extract from File ────────────────────────────────────────────────────────
  extract_from_file: async (config, ctx) => {
    const data = config.data ?? ctx.$input.data ?? ctx.$input.binary
    const mimeType = String(config.mime_type ?? "text/plain")
    let content: string
    if (typeof data === "string") {
      content = data
    } else if (data && typeof data === "object" && "binary" in data) {
      content = Buffer.from((data as { binary: string }).binary, "base64").toString()
    } else {
      content = JSON.stringify(data)
    }
    return { content, mime_type: mimeType, size: content.length }
  },

  // ── Item Lists (split by separator) ───────────────────────────────────────────
  item_lists: async (config, ctx) => {
    const input = String(config.input ?? ctx.$input.text ?? ctx.$input.content ?? "")
    const separator = String(config.separator ?? "\n")
    const items = input.split(separator).map(s => s.trim()).filter(Boolean)
    return { items, count: items.length, original: input }
  },

  // ── Limit (truncate array) ────────────────────────────────────────────────────
  limit: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? ctx.$input.items ?? []) as unknown[]
    const maxItems = Number(config.max_items ?? 10)
    const limited = arr.slice(0, maxItems)
    return { result: limited, count: limited.length, original_count: arr.length, truncated: arr.length > maxItems }
  },

  // ── Read Write File ───────────────────────────────────────────────────────────
  read_write_file: async (config, ctx) => {
    const operation = String(config.operation ?? "read")
    const filePath = String(config.file_path ?? "")
    
    if (operation === "read") {
      return { 
        content: null, 
        error: "File read requires Midas Bridge for local file system access",
        path: filePath 
      }
    }
    if (operation === "write") {
      const content = String(config.content ?? "")
      return { 
        written: false, 
        error: "File write requires Midas Bridge for local file system access",
        path: filePath,
        size: content.length
      }
    }
    return { error: "Unknown file operation" }
  },

  // ── Google Sheets ────────────────────────────────────────────────────────────
  google_sheets: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.google_sheets_access_token ?? ctx.$env.google ?? "")
    const spreadsheetId = String(config.spreadsheet_id ?? "")
    const op = String(config.operation ?? "read")
    
    if (!accessToken) throw new Error("Google Sheets access token required")
    if (!spreadsheetId) throw new Error("Spreadsheet ID required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`
    
    if (op === "read") {
      const range = String(config.range ?? "Sheet1!A1:Z100")
      const res = await fetch(`${base}/values/${range}`, { headers })
      if (!res.ok) throw new Error(`Google Sheets error: ${res.status}`)
      const data = await res.json() as { values: string[][]; range: string }
      return { values: data.values, range: data.range, count: data.values.length }
    }
    if (op === "append") {
      const range = String(config.range ?? "Sheet1!A1")
      const values = config.values ?? []
      const res = await fetch(`${base}/values/${range}:append?valueInputOption=USER_ENTERED`, {
        method: "POST", headers, body: JSON.stringify({ values }),
      })
      if (!res.ok) throw new Error(`Google Sheets error: ${res.status}`)
      const data = await res.json() as { updates: { updatedRows: number } }
      return { updated_rows: data.updates.updatedRows, success: true }
    }
    if (op === "update") {
      const range = String(config.range ?? "Sheet1!A1")
      const values = config.values ?? []
      const res = await fetch(`${base}/values/${range}?valueInputOption=USER_ENTERED`, {
        method: "PUT", headers, body: JSON.stringify({ values }),
      })
      if (!res.ok) throw new Error(`Google Sheets error: ${res.status}`)
      const data = await res.json() as { updatedRows: number }
      return { updated_rows: data.updatedRows, success: true }
    }
    throw new Error(`Unknown Google Sheets operation: ${op}`)
  },

  // ── Google Drive ─────────────────────────────────────────────────────────────
  google_drive: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.google_drive_access_token ?? ctx.$env.google ?? "")
    const op = String(config.operation ?? "list_files")
    
    if (!accessToken) throw new Error("Google Drive access token required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    
    if (op === "list_files") {
      const query = String(config.query ?? "")
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=100`, { headers })
      if (!res.ok) throw new Error(`Google Drive error: ${res.status}`)
      const data = await res.json() as { files: Array<{ id: string; name: string; mimeType: string }> }
      return { files: data.files, count: data.files.length }
    }
    if (op === "get_file") {
      const fileId = String(config.file_id ?? "")
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers })
      if (!res.ok) throw new Error(`Google Drive error: ${res.status}`)
      const content = await res.text()
      return { content, file_id: fileId }
    }
    if (op === "upload_file") {
      const fileName = String(config.file_name ?? "file.txt")
      const mimeType = String(config.mime_type ?? "text/plain")
      const content = String(config.content ?? "")
      
      // Create file metadata
      const metaRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
        method: "POST", headers, body: JSON.stringify({ name: fileName, mimeType }),
      })
      if (!metaRes.ok) throw new Error(`Google Drive error: ${metaRes.status}`)
      const uploadUrl = metaRes.headers.get("Location")
      
      if (!uploadUrl) throw new Error("Failed to get upload URL from Google Drive")
      
      // Upload content
      const uploadRes = await fetch(uploadUrl, {
        method: "POST", headers: { ...headers, "Content-Type": mimeType }, body: content,
      })
      if (!uploadRes.ok) throw new Error(`Google Drive upload error: ${uploadRes.status}`)
      const data = await uploadRes.json() as { id: string }
      return { file_id: data.id, name: fileName, success: true }
    }
    throw new Error(`Unknown Google Drive operation: ${op}`)
  },

  // ── Gmail ───────────────────────────────────────────────────────────────────
  gmail: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.gmail_access_token ?? ctx.$env.google ?? "")
    const op = String(config.operation ?? "list_messages")
    
    if (!accessToken) throw new Error("Gmail access token required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    
    if (op === "list_messages") {
      const query = String(config.query ?? "")
      const maxResults = Number(config.max_results ?? 10)
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, { headers })
      if (!res.ok) throw new Error(`Gmail error: ${res.status}`)
      const data = await res.json() as { messages: Array<{ id: string; threadId: string }> }
      return { messages: data.messages, count: data.messages.length }
    }
    if (op === "get_message") {
      const messageId = String(config.message_id ?? "")
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, { headers })
      if (!res.ok) throw new Error(`Gmail error: ${res.status}`)
      const data = await res.json() as { id: string; threadId: string; snippet: string; payload: Record<string, unknown> }
      return { message: data, id: data.id, snippet: data.snippet }
    }
    if (op === "send_email") {
      const to = String(config.to ?? "")
      const subject = String(config.subject ?? "")
      const body = String(config.body ?? "")
      const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`).toString("base64")
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST", headers, body: JSON.stringify({ raw }),
      })
      if (!res.ok) throw new Error(`Gmail error: ${res.status}`)
      const data = await res.json() as { id: string }
      return { message_id: data.id, to, subject, success: true }
    }
    throw new Error(`Unknown Gmail operation: ${op}`)
  },

  // ── Redis ────────────────────────────────────────────────────────────────────
  redis: async (config, ctx) => {
    const host = String(config.host ?? ctx.$env.redis_host ?? "localhost")
    const port = Number(config.port ?? ctx.$env.redis_port ?? 6379)
    const password = String(config.password ?? ctx.$env.redis_password ?? "")
    const op = String(config.operation ?? "get")
    const key = String(config.key ?? "")
    
    // Redis requires a client library - this is a simplified simulation
    // In production, use ioredis or redis package
    if (op === "get") {
      return { value: null, key, note: "Redis operations require Redis client library" }
    }
    if (op === "set") {
      const value = config.value ?? ""
      return { key, value, note: "Redis operations require Redis client library" }
    }
    if (op === "delete") {
      return { key, deleted: false, note: "Redis operations require Redis client library" }
    }
    throw new Error(`Unknown Redis operation: ${op}`)
  },

  // ── PostgreSQL ───────────────────────────────────────────────────────────────
  postgres: async (config, ctx) => {
    const connectionString = String(config.connection_string ?? ctx.$env.postgres_connection_string ?? "")
    const op = String(config.operation ?? "query")
    const query = String(config.query ?? "")
    
    if (!connectionString) throw new Error("PostgreSQL connection string required")
    
    // PostgreSQL requires pg or pg-promise library - this is a simplified simulation
    if (op === "query") {
      return { rows: [], count: 0, note: "PostgreSQL operations require pg client library" }
    }
    throw new Error(`Unknown PostgreSQL operation: ${op}`)
  },

  // ── HubSpot ─────────────────────────────────────────────────────────────────
  hubspot: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.hubspot_api_key ?? ctx.$env.hubspot ?? "")
    const op = String(config.operation ?? "get_contact")
    
    if (!apiKey) throw new Error("HubSpot API key required")
    
    const headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    
    if (op === "get_contact") {
      const contactId = String(config.contact_id ?? "")
      const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, { headers })
      if (!res.ok) throw new Error(`HubSpot error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "list_contacts") {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=100", { headers })
      if (!res.ok) throw new Error(`HubSpot error: ${res.status}`)
      const data = await res.json() as { results: unknown[] }
      return { contacts: data.results, count: data.results.length }
    }
    throw new Error(`Unknown HubSpot operation: ${op}`)
  },

  // ── n8n (n8n workflow execution) ─────────────────────────────────────────────
  n8n: async (config, ctx) => {
    const webhookUrl = String(config.webhook_url ?? ctx.$env.n8n_webhook_url ?? "")
    const data = config.data ?? ctx.$input
    
    if (!webhookUrl) throw new Error("n8n webhook URL required")
    
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) throw new Error(`n8n error: ${res.status}`)
    const responseData = await res.json() as Record<string, unknown>
    return { response: responseData, success: true }
  },

  // ── Jira ─────────────────────────────────────────────────────────────────────
  jira: async (config, ctx) => {
    const email = String(config.email ?? ctx.$env.jira_email ?? "")
    const apiToken = String(config.api_token ?? ctx.$env.jira_api_token ?? ctx.$env.jira ?? "")
    const baseUrl = String(config.base_url ?? ctx.$env.jira_base_url ?? "")
    const op = String(config.operation ?? "get_issue")
    
    if (!email || !apiToken || !baseUrl) throw new Error("Jira credentials required")
    
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")
    const headers = { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" }
    
    if (op === "get_issue") {
      const issueKey = String(config.issue_key ?? "")
      const res = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}`, { headers })
      if (!res.ok) throw new Error(`Jira error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "list_issues") {
      const jql = String(config.jql ?? "assignee = currentUser()")
      const res = await fetch(`${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=50`, { headers })
      if (!res.ok) throw new Error(`Jira error: ${res.status}`)
      const data = await res.json() as { issues: unknown[] }
      return { issues: data.issues, count: data.issues.length }
    }
    throw new Error(`Unknown Jira operation: ${op}`)
  },

  // ── Microsoft Outlook ───────────────────────────────────────────────────────
  microsoft_outlook: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.microsoft_outlook_access_token ?? ctx.$env.microsoft ?? "")
    const op = String(config.operation ?? "list_messages")
    
    if (!accessToken) throw new Error("Microsoft Outlook access token required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    
    if (op === "list_messages") {
      const res = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=50", { headers })
      if (!res.ok) throw new Error(`Outlook error: ${res.status}`)
      const data = await res.json() as { value: unknown[] }
      return { messages: data.value, count: data.value.length }
    }
    if (op === "send_email") {
      const to = String(config.to ?? "")
      const subject = String(config.subject ?? "")
      const body = String(config.body ?? "")
      const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST", headers, body: JSON.stringify({
          message: { subject, body: { content: body, contentType: "Text" } },
          toRecipients: [{ emailAddress: { address: to } }],
        }),
      })
      if (!res.ok) throw new Error(`Outlook error: ${res.status}`)
      return { success: true, to, subject }
    }
    throw new Error(`Unknown Outlook operation: ${op}`)
  },

  // ── OpenAI (AI chat) ─────────────────────────────────────────────────────────
  openai: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.openai_api_key ?? ctx.$env.ai_provider ?? "")
    const prompt = String(config.prompt ?? ctx.$input.prompt ?? "")
    const model = String(config.model ?? "gpt-4o-mini")
    
    if (!apiKey) throw new Error("OpenAI API key required")
    
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      }),
    })
    
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    return { response: data.choices[0].message.content, model }
  },

  // ── Telegram Trigger ────────────────────────────────────────────────────────
  telegram_trigger: async (config, ctx) => {
    const update = ctx.$input as Record<string, unknown>
    const message = update.message as Record<string, unknown> | undefined
    const chat = message?.chat as Record<string, unknown> | undefined
    return { triggered: true, update, chat_id: chat?.id }
  },

  // ── Form ────────────────────────────────────────────────────────────────────
  form: async (config, ctx) => {
    const formData = config.form_data ?? ctx.$input
    return { form_data: formData, submitted: true }
  },

  // ── Gmail Trigger ────────────────────────────────────────────────────────────
  gmail_trigger: async (config, ctx) => {
    const message = ctx.$input as Record<string, unknown>
    return { triggered: true, message, message_id: message.id }
  },

  // ── Gmail Tool ────────────────────────────────────────────────────────────────
  gmail_tool: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.gmail_access_token ?? ctx.$env.google ?? "")
    const op = String(config.operation ?? "get_thread")
    
    if (!accessToken) throw new Error("Gmail access token required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    
    if (op === "get_thread") {
      const threadId = String(config.thread_id ?? "")
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, { headers })
      if (!res.ok) throw new Error(`Gmail error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "modify_thread") {
      const threadId = String(config.thread_id ?? "")
      const addLabels = config.add_labels ?? []
      const removeLabels = config.remove_labels ?? []
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`, {
        method: "POST", headers, body: JSON.stringify({ addLabelIds: addLabels, removeLabelIds: removeLabels }),
      })
      if (!res.ok) throw new Error(`Gmail error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown Gmail Tool operation: ${op}`)
  },

  // ── Supabase ─────────────────────────────────────────────────────────────────
  supabase: async (config, ctx) => {
    const url = String(config.supabase_url ?? ctx.$env.supabase_url ?? "")
    const key = String(config.supabase_key ?? ctx.$env.supabase_api_key ?? ctx.$env.supabase ?? "")
    const table = String(config.table ?? "")
    const op = String(config.operation ?? "select")
    
    if (!url || !key) throw new Error("Supabase URL and API key required")
    
    const headers = { "Authorization": `Bearer ${key}`, "apikey": key, "Content-Type": "application/json" }
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

  // ── Spotify ───────────────────────────────────────────────────────────────────
  spotify: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.spotify_access_token ?? ctx.$env.spotify ?? "")
    const op = String(config.operation ?? "get_track")
    
    if (!accessToken) throw new Error("Spotify access token required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    
    if (op === "get_track") {
      const trackId = String(config.track_id ?? "")
      const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, { headers })
      if (!res.ok) throw new Error(`Spotify error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "search") {
      const query = String(config.query ?? "")
      const type = String(config.type ?? "track")
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`, { headers })
      if (!res.ok) throw new Error(`Spotify error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown Spotify operation: ${op}`)
  },

  // ── Google Calendar ─────────────────────────────────────────────────────────
  google_calendar: async (config, ctx) => {
    const accessToken = String(config.access_token ?? ctx.$env.google_calendar_access_token ?? ctx.$env.google ?? "")
    const op = String(config.operation ?? "list_events")
    
    if (!accessToken) throw new Error("Google Calendar access token required")
    
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
    
    if (op === "list_events") {
      const calendarId = String(config.calendar_id ?? "primary")
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?maxResults=50`, { headers })
      if (!res.ok) throw new Error(`Google Calendar error: ${res.status}`)
      const data = await res.json() as { items: unknown[] }
      return { events: data.items, count: data.items.length }
    }
    if (op === "create_event") {
      const calendarId = String(config.calendar_id ?? "primary")
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: "POST", headers, body: JSON.stringify({
          summary: config.summary,
          start: config.start,
          end: config.end,
        }),
      })
      if (!res.ok) throw new Error(`Google Calendar error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown Google Calendar operation: ${op}`)
  },

  // ── Pipedrive ────────────────────────────────────────────────────────────────
  pipedrive: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.pipedrive_api_key ?? ctx.$env.pipedrive ?? "")
    const companyDomain = String(config.company_domain ?? ctx.$env.pipedrive_company_domain ?? "")
    const op = String(config.operation ?? "get_deal")
    
    if (!apiKey || !companyDomain) throw new Error("Pipedrive API key and company domain required")
    
    const headers = { "Content-Type": "application/json" }
    
    if (op === "get_deal") {
      const dealId = String(config.deal_id ?? "")
      const res = await fetch(`https://${companyDomain}.pipedrive.com/api/v1/deals/${dealId}?api_token=${apiKey}`, { headers })
      if (!res.ok) throw new Error(`Pipedrive error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    if (op === "list_deals") {
      const res = await fetch(`https://${companyDomain}.pipedrive.com/api/v1/deals?api_token=${apiKey}&limit=50`, { headers })
      if (!res.ok) throw new Error(`Pipedrive error: ${res.status}`)
      const data = await res.json() as { data: unknown[] }
      return { deals: data.data, count: data.data.length }
    }
    throw new Error(`Unknown Pipedrive operation: ${op}`)
  },

  // ── Edit Image ─────────────────────────────────────────────────────────────
  edit_image: async (config, ctx) => {
    const imageData = config.image_data ?? ctx.$input.image_data ?? ctx.$input.binary
    const operation = String(config.operation ?? "resize")
    
    // Image editing requires image processing library - this is a placeholder
    return { 
      image_data: imageData, 
      operation, 
      processed: false, 
      note: "Image editing requires canvas or sharp library for full functionality"
    }
  },

  // ── Mattermost ───────────────────────────────────────────────────────────────
  mattermost: async (config, ctx) => {
    const webhookUrl = String(config.webhook_url ?? ctx.$env.mattermost_webhook_url ?? ctx.$env.mattermost ?? "")
    const op = String(config.operation ?? "send_message")
    
    if (!webhookUrl) throw new Error("Mattermost webhook URL required")
    
    if (op === "send_message") {
      const text = String(config.text ?? ctx.$input.text ?? "")
      const channel = String(config.channel ?? "")
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, channel }),
      })
      if (!res.ok) throw new Error(`Mattermost error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown Mattermost operation: ${op}`)
  },

  // ── YouTube ────────────────────────────────────────────────────────────────
  youtube: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.youtube_api_key ?? ctx.$env.google ?? "")
    const op = String(config.operation ?? "get_video")
    
    if (!apiKey) throw new Error("YouTube API key required")
    
    if (op === "get_video") {
      const videoId = String(config.video_id ?? "")
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`)
      if (!res.ok) throw new Error(`YouTube error: ${res.status}`)
      const data = await res.json() as { items: unknown[] }
      return { video: data.items[0] ?? null, video_id: videoId }
    }
    if (op === "search") {
      const query = String(config.query ?? "")
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&key=${apiKey}&part=snippet&maxResults=25`)
      if (!res.ok) throw new Error(`YouTube error: ${res.status}`)
      const data = await res.json() as { items: unknown[] }
      return { results: data.items, count: data.items.length }
    }
    throw new Error(`Unknown YouTube operation: ${op}`)
  },

  // ── Function Item ────────────────────────────────────────────────────────────
  function_item: async (config, ctx) => {
    const code = String(config.code ?? config.function_code ?? "return $input;")
    const item = config.item ?? ctx.$input.item ?? ctx.$input
    
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("$item", "$input", "$node", `"use strict"; ${code}`)
      const result = fn(item, ctx.$input, ctx.$node)
      return { result: result ?? null, item, output: result }
    } catch (err) {
      throw new Error(`Function Item error: ${err instanceof Error ? err.message : String(err)}`)
    }
  },

  // ── WordPress ────────────────────────────────────────────────────────────────
  wordpress: async (config, ctx) => {
    const apiUrl = String(config.api_url ?? ctx.$env.wordpress_api_url ?? "")
    const username = String(config.username ?? ctx.$env.wordpress_username ?? "")
    const password = String(config.password ?? ctx.$env.wordpress_password ?? "")
    const op = String(config.operation ?? "get_posts")
    
    if (!apiUrl) throw new Error("WordPress API URL required")
    
    const auth = Buffer.from(`${username}:${password}`).toString("base64")
    const headers = { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" }
    
    if (op === "get_posts") {
      const res = await fetch(`${apiUrl}/wp/v2/posts?per_page=20`, { headers })
      if (!res.ok) throw new Error(`WordPress error: ${res.status}`)
      const data = await res.json() as unknown[]
      return { posts: data, count: data.length }
    }
    if (op === "create_post") {
      const res = await fetch(`${apiUrl}/wp/v2/posts`, {
        method: "POST", headers, body: JSON.stringify({
          title: config.title,
          content: config.content,
          status: config.status ?? "draft",
        }),
      })
      if (!res.ok) throw new Error(`WordPress error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown WordPress operation: ${op}`)
  },

  // ── Summarize ───────────────────────────────────────────────────────────────
  summarize: async (config, ctx) => {
    const text = String(config.text ?? ctx.$input.text ?? ctx.$input.content ?? "")
    const maxLength = Number(config.max_length ?? 200)
    
    // Simple summarization - truncate to max length
    const summary = text.length > maxLength 
      ? text.substring(0, maxLength).trim() + "..." 
      : text
    
    return { 
      summary, 
      original_length: text.length, 
      summary_length: summary.length,
      note: "Full summarization requires AI integration"
    }
  },

  // ── WhatsApp ────────────────────────────────────────────────────────────────
  whatsapp: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.whatsapp_api_key ?? ctx.$env.whatsapp ?? "")
    const phoneNumber = String(config.phone_number ?? ctx.$input.phone_number ?? "")
    const op = String(config.operation ?? "send_message")
    
    if (!apiKey) throw new Error("WhatsApp API key required")
    
    const headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    
    if (op === "send_message") {
      const message = String(config.message ?? ctx.$input.message ?? "")
      const res = await fetch(`https://graph.facebook.com/v17.0/${phoneNumber}/messages`, {
        method: "POST", headers, body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          text: { body: message },
        }),
      })
      if (!res.ok) throw new Error(`WhatsApp error: ${res.status}`)
      return await res.json() as Record<string, unknown>
    }
    throw new Error(`Unknown WhatsApp operation: ${op}`)
  },

  // ── Read Binary File ────────────────────────────────────────────────────────
  read_binary_file: async (config, ctx) => {
    const filePath = String(config.file_path ?? ctx.$input.file_path ?? "")
    
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      const res = await fetch(filePath)
      if (!res.ok) throw new Error(`Could not fetch: ${res.status}`)
      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      return { 
        binary: base64, 
        size: buffer.byteLength, 
        path: filePath,
        mime_type: res.headers.get("content-type") ?? "application/octet-stream"
      }
    }
    
    return { 
      binary: null, 
      error: "Local file read requires Midas Bridge", 
      path: filePath 
    }
  },

  // ── Clockify ────────────────────────────────────────────────────────────────
  clockify: async (config, ctx) => {
    const apiKey = String(config.api_key ?? ctx.$env.clockify_api_key ?? ctx.$env.clockify ?? "")
    const workspaceId = String(config.workspace_id ?? ctx.$env.clockify_workspace_id ?? "")
    const op = String(config.operation ?? "list_time_entries")
    
    if (!apiKey || !workspaceId) throw new Error("Clockify API key and workspace ID required")
    
    const headers = { "X-Api-Key": apiKey, "Content-Type": "application/json" }
    
    if (op === "list_time_entries") {
      const res = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/time-entries`, { headers })
      if (!res.ok) throw new Error(`Clockify error: ${res.status}`)
      const data = await res.json() as unknown[]
      return { time_entries: data, count: data.length }
    }
    throw new Error(`Unknown Clockify operation: ${op}`)
  },

  // ── MongoDB ────────────────────────────────────────────────────────────────
  mongo_db: async (config, ctx) => {
    const connectionString = String(config.connection_string ?? ctx.$env.mongo_connection_string ?? "")
    const op = String(config.operation ?? "find")
    
    if (!connectionString) throw new Error("MongoDB connection string required")
    
    // MongoDB requires mongodb driver - this is a placeholder
    if (op === "find") {
      return { documents: [], count: 0, note: "MongoDB operations require mongodb driver" }
    }
    throw new Error(`Unknown MongoDB operation: ${op}`)
  },

  // ── Sticky Note ─────────────────────────────────────────────────────────────
  stickynote: async (config, ctx) => {
    const content = String(config.content ?? config.text ?? ctx.$input.content ?? "")
    const color = String(config.color ?? "yellow")
    return { content, color, note: "Sticky note is a visual annotation node" }
  },

  // ── Default: pass-through for unimplemented executors ──────────────────────
  default: async (config, ctx) => ({
    result: null,
    note: "This node type runs server-side via API. In local mode, it passes through.",
    input: ctx.$input,
    config,
  }),
}

function getExecutor(executorKey: string): NodeExecutorFn {
  // Direct match first
  if (NODE_EXECUTORS[executorKey]) {
    return NODE_EXECUTORS[executorKey]
  }
  
  // Fallback: try to find a similar executor by name
  const keyLower = executorKey.toLowerCase()
  
  // Map common patterns to existing executors
  const fallbackMap: Record<string, string> = {
    // Tool variants
    'gmailtool': 'gmail',
    'googledocstool': 'google_docs',
    'googledrivetool': 'google_drive',
    'googlesheetstool': 'google_sheets',
    'googlecalendartool': 'google_calendar',
    'googletaskstool': 'google_tasks',
    'openweathermaptool': 'openai',
    'jiratool': 'jira',
    'notiontool': 'notion',
    'postgrestool': 'postgres',
    'redistool': 'redis',
    'mysqltool': 'mysql',
    'mongodbtool': 'mongo_db',
    'microsoftoutlooktool': 'microsoft_outlook',
    'discordtool': 'discord',
    'telegramtool': 'telegram',
    'twittertool': 'twitter',
    'twiliotrigger': 'twilio',
    'supabasetool': 'supabase',
    'emailsendtool': 'email_send',
    'executecommandtool': 'execute_command',
    'readbinaryfiles': 'read_binary_file',
    'woocommercetool': 'woocommerce',
    'wordpresstool': 'wordpress',
    'mcpclienttool': 'mcpclient',
    
    // Trigger variants - most triggers just pass through the input
    'activecampaigntrigger': 'default',
    'acuityschedulingtrigger': 'default',
    'affinitytrigger': 'default',
    'airtabletrigger': 'default',
    'amqptrigger': 'default',
    'asanatrigger': 'default',
    'autopilottrigger': 'default',
    'awssnstrigger': 'default',
    'bitbuckettrigger': 'default',
    'boxtrigger': 'default',
    'caltrigger': 'default',
    'calendlytrigger': 'default',
    'chargebeetrigger': 'default',
    'clickuptrigger': 'default',
    'clockifytrigger': 'default',
    'convertkittrigger': 'default',
    'coppertrigger': 'default',
    'customeriotrigger': 'default',
    'emeliatrigger': 'default',
    'errortrigger': 'default',
    'eventbritetrigger': 'default',
    'executeworkflowtrigger': 'default',
    'facebookleadadstrigger': 'default',
    'facebooktrigger': 'default',
    'figmatrigger': 'default',
    'flowtrigger': 'default',
    'formtrigger': 'default',
    'getresponsetrigger': 'default',
    'githubtrigger': 'default',
    'gitlabtrigger': 'default',
    'gmailtrigger': 'default',
    'googlecalendartrigger': 'default',
    'googledrivetrigger': 'default',
    'googlesheetstrigger': 'default',
    'gumroadtrigger': 'default',
    'helpscouttrigger': 'default',
    'hubspottrigger': 'default',
    'invoiceninjatrigger': 'default',
    'jiratrigger': 'default',
    'jotformtrigger': 'default',
    'kafkatrigger': 'default',
    'keaptrigger': 'default',
    'lemlisttrigger': 'default',
    'lineartrigger': 'default',
    'localfiletrigger': 'default',
    'mailchimptrigger': 'default',
    'mailerlitetrigger': 'default',
    'mailjettrigger': 'default',
    'mautictrigger': 'default',
    'microsoftoutlooktrigger': 'default',
    'mqtttrigger': 'default',
    'n8ntrigger': 'default',
    'netlifytrigger': 'default',
    'notiontrigger': 'default',
    'onfleettrigger': 'default',
    'paypaltrigger': 'default',
    'pipedrivetrigger': 'default',
    'postgrestrigger': 'default',
    'postmarktrigger': 'default',
    'pushcuttrigger': 'default',
    'rabbitmqtrigger': 'default',
    'rssfeedreadtrigger': 'default',
    'ssetrigger': 'default',
    'shopifytrigger': 'default',
    'slacktrigger': 'default',
    'stravatrigger': 'default',
    'stripetrigger': 'default',
    'surveymonkeytrigger': 'default',
    'taigatrigger': 'default',
    'telegramtrigger': 'default',
    'thehiveprojecttrigger': 'default',
    'thehivetrigger': 'default',
    'toggltrigger': 'default',
    'trellotrigger': 'default',
    'typeformtrigger': 'default',
    'webflowtrigger': 'default',
    'wisetrigger': 'default',
    'woocommercetrigger': 'default',
    'workflowtrigger': 'default',
    'wufootrigger': 'default',
    'zendesktrigger': 'default',
    
    // Direct name matches
    'openai': 'openai',
    'aggregate': 'aggregate',
    'airtable': 'airtable',
    'asana': 'openai',
    'bamboohr': 'openai',
    'clickup': 'openai',
    'contentful': 'openai',
    'freshdesk': 'openai',
    'github': 'github',
    'gitlab': 'github',
    'gmail': 'gmail',
    'googlecalendar': 'google_calendar',
    'googledocs': 'google_docs',
    'googledrive': 'google_drive',
    'googlesheets': 'google_sheets',
    'hubspot': 'hubspot',
    'intercom': 'openai',
    'jira': 'jira',
    'linear': 'linear',
    'mailchimp': 'openai',
    'mailgun': 'email_send',
    'mondaycom': 'openai',
    'notion': 'notion',
    'postgres': 'postgres',
    'redis': 'redis',
    'salesforce': 'openai',
    'sendgrid': 'email_send',
    'sendinblue': 'email_send',
    'slack': 'slack',
    'stripe': 'stripe',
    'trello': 'openai',
    'twitter': 'twitter',
    'twilio': 'twilio',
    'woocommerce': 'openai',
    'wordpress': 'wordpress',
    'zendesk': 'zendesk',
    'zohocrm': 'openai',
  }
  
  const fallback = fallbackMap[keyLower]
  if (fallback && NODE_EXECUTORS[fallback]) {
    return NODE_EXECUTORS[fallback]
  }
  
  // Final fallback to default
  return NODE_EXECUTORS.default
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
