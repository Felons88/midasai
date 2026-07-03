import { NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { runWithAIReservation } from "@/lib/billing/ai-reservation"

function normalizeMarkdownFile(name: string): string {
  const base = name.trim().replace(/\s+/g, "_")
  const ext = base.split(".").pop()?.toLowerCase()
  if (ext === "md") return base
  const stem = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base
  return `${stem}.md`
}

function buildSystemPrompt(platformSkills: PlatformSkill[]): string {
  const skillsContext = platformSkills.length > 0
    ? `\n\n## Available Skills on MidasAI Platform\nWhen recommending skills in your summary, PREFER these real skills from our marketplace. Use their exact title as the skill name and include their installCommand and marketplaceUrl in the reason field.\n\n${platformSkills.map(s =>
        `- **${s.title}**: ${s.description || "No description"}${s.installCommand ? `\n  Install: \`${s.installCommand}\`` : ""}${s.marketplaceUrl ? `\n  URL: ${s.marketplaceUrl}` : ""}`
      ).join("\n")}`
    : ""

  return `You are Midas Architect — an autonomous AI Systems Architect inside the MidasAI platform.

Your mission: transform a user's idea into a complete AI project architecture through smart discovery, then immediately produce the full plan and begin building. You are an AGENT — you do the work, you don't ask for permission.
${skillsContext}

## How You Work

### Phase 1: Discovery (confidence < 85)
Ask smart questions to understand:
- The actual problem being solved
- Who uses it and who maintains it
- What outputs they need (files, reports, APIs, dashboards)
- What integrations exist
- Tech preferences (Claude, Cursor, Windsurf, Gemini, etc.)
- Scale and deployment environment

Discovery rules:
- EVERY message MUST end with exactly 1-2 questions maximum
- NEVER send a statement-only message — that stalls the conversation
- NEVER ask 3+ questions at once — pick the 1-2 most valuable
- If confidence is 75-84, ask 1 final question then immediately move to phase 2
- Confidence NEVER decreases — only increases as information arrives

### Phase 2: Architecture Ready (confidence >= 85)
When confident, set phase to "ready" and produce the full plan.

The "message" field at ready phase MUST be a detailed, formatted markdown plan including:
1. A brief enthusiastic opening (1-2 sentences)
2. ## Project Overview — name, goal, target users
3. ## Agents — bullet list, each agent with name, role, key responsibilities
4. ## Skills — bullet list using REAL skills from the platform above where possible, each with install command or marketplace link
5. ## Workflows — numbered list of key workflows
6. ## Files to Generate — list of all markdown files that will be created
7. A closing line: "I'm now generating all project files automatically — you'll be notified when complete."

## File Format Rule
All files in the filesToGenerate array MUST end with .md. Architect generates documentation only — never code files like .ts, .tsx, .js, .py, or .json. If you are tempted to create a config or schema example, include it inside a markdown code block instead of as a separate file.

Do NOT put JSON inside the message field. The message is pure markdown prose.
Do NOT ask more questions. Do NOT say "let me know if you want to proceed". Just deliver the plan.

## Response Format
Always respond with this exact JSON structure:
{
  "message": "your detailed markdown plan here",
  "confidence": 0-100,
  "phase": "discovery" | "ready",
  "summary": null or {
    "projectName": "...",
    "goal": "...",
    "agents": [{"name": "...", "role": "...", "responsibilities": "..."}],
    "skills": [{"name": "...", "reason": "...", "installCommand": "...", "marketplaceUrl": "..."}],
    "workflows": ["..."],
    "filesToGenerate": ["README.md", "AGENTS.md", "SKILLS.md", "WORKFLOWS.md", "CONTEXT.md", "ARCHITECTURE.md", "SECURITY.md", "DEPLOYMENT.md"]
  }
}

## Confidence Tracking
Track across: Goal clarity, Audience, Outputs, Tech Stack, Agents Needed, Skills Needed, Workflows.
- Start at 30 on first message
- Increase 10-20 per substantive answer
- At 85+: set phase "ready", populate full summary, write detailed plan in message

CRITICAL OUTPUT RULE: Your ENTIRE response must be a single raw JSON object. Start with { end with }. No text before or after. No markdown fences. No "Here is my response:". The message field contains markdown — all other fields are plain JSON values.`
}

interface PlatformSkill {
  id: string
  title: string
  slug: string
  description: string
  githubUrl: string | null
  installCommand: string | null
  marketplaceUrl: string
  tags: string[]
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, currentConfidence } = await req.json()
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 })

    // Chat: verified free models as of June 2026 (sourced from OpenRouter /api/v1/models)
    // openrouter/free is first — it auto-routes to whichever free model is available right now
    const MODELS = [
      "openrouter/free",
      "google/gemma-4-31b-it:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "openai/gpt-oss-120b:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "google/gemma-4-26b-a4b-it:free",
      "openai/gpt-oss-20b:free",
    ]

    // Fetch relevant platform skills from DB based on last user message keywords
    let platformSkills: PlatformSkill[] = []
    try {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content ?? ""
      const keywords = lastUserMsg
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 4)
        .slice(0, 6)
        .join(",")
      if (keywords) {
        const supabase = createServiceClient()
        const { data } = await supabase
          .from("listings")
          .select(`id, title, slug, short_description, github_url, tags, listing_install_commands ( command, platform )`)
          .eq("type", "SKILL")
          .eq("status", "ACTIVE")
          .or(keywords.split(",").map((k: string) => `title.ilike.%${k}%`).join(","))
          .limit(20)
        if (data) {
          const seen = new Set<string>()
          platformSkills = data
            .filter((r: any) => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
            .slice(0, 12)
            .map((r: any) => {
              const cmds: any[] = r.listing_install_commands ?? []
              const cliCmd = cmds.find((c: any) => c.platform === "CLI")
              const manualCmd = cmds.find((c: any) => c.platform === "MANUAL")
              return {
                id: r.id, title: r.title, slug: r.slug,
                description: r.short_description ?? "",
                githubUrl: r.github_url,
                installCommand: cliCmd?.command ?? manualCmd?.command ?? null,
                marketplaceUrl: `https://midasai.com/listing/${r.slug}`,
                tags: r.tags ?? [],
              }
            })
        }
      }
    } catch (e) {
      console.warn("[architect/chat] skills fetch failed:", e)
    }

    const SYSTEM_PROMPT = buildSystemPrompt(platformSkills)

    async function tryModel(model: string): Promise<string> {
      const systemWithContext = currentConfidence > 0
        ? `${SYSTEM_PROMPT}\n\nCurrent session confidence: ${currentConfidence}%. Your next response confidence MUST be >= ${currentConfidence}% — never goes backwards.`
        : SYSTEM_PROMPT

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://midasai.com",
          "X-Title": "MidasAI Architect",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemWithContext } as const,
            ...messages,
          ],
          max_tokens: 4000,
          temperature: 0.4,
          // No response_format — free models reject it and wrap JSON in prose
        }),
        signal: AbortSignal.timeout(45000),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`${model} → ${res.status}: ${t.slice(0, 200)}`)
      }
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content ?? ""
      if (!content) throw new Error(`${model} → empty response`)
      console.log(`[architect/chat] model=${model} raw_len=${content.length} preview=${content.slice(0, 80)}`)
      return content
    }

    // Sequential fallback — try each model until one succeeds
    // 429s are deferred and retried once at the end after a brief pause
    const aiResult = await runWithAIReservation(
      { supabase, userId: user.id },
      {
        featureKey: "ai_chat",
        operationId: `architect-chat-${user.id}-${Date.now()}`,
        provider: "openrouter",
      },
      async () => {
        let raw = ""
        const errors: string[] = []
        const rateLimited: string[] = []
        for (const model of MODELS) {
          try {
            raw = await tryModel(model)
            break
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            console.error(`[architect/chat] ${msg}`)
            if (msg.includes("429")) {
              rateLimited.push(model)
            } else {
              errors.push(msg)
            }
          }
        }
        if (!raw && rateLimited.length > 0) {
          await new Promise(r => setTimeout(r, 3000))
          for (const model of rateLimited) {
            try {
              raw = await tryModel(model)
              break
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e)
              console.error(`[architect/chat] retry ${msg}`)
              errors.push(msg)
            }
          }
        }
        if (!raw) throw new Error(`All models failed: ${[...errors].join(" | ")}`)
        return raw
      }
    )

    if (aiResult.error) {
      return NextResponse.json(
        {
          error: aiResult.error,
          credits: {
            reserved: aiResult.creditsReserved,
            charged: aiResult.creditsCharged,
            refunded: aiResult.creditsRefunded,
            balance: aiResult.availableBalance,
          },
        },
        { status: aiResult.error.includes("Insufficient credits") ? 402 : 500 }
      )
    }

    let raw = aiResult.result as string

    // Repair JSON with unescaped newlines/tabs inside string values
    function repairJSON(text: string): string {
      // Replace literal newlines/tabs that appear inside quoted strings
      let inString = false
      let escaped = false
      let result = ""
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (escaped) { result += ch; escaped = false; continue }
        if (ch === "\\") { result += ch; escaped = true; continue }
        if (ch === '"') { inString = !inString; result += ch; continue }
        if (inString) {
          if (ch === "\n") { result += "\\n"; continue }
          if (ch === "\r") { result += "\\r"; continue }
          if (ch === "\t") { result += "\\t"; continue }
        }
        result += ch
      }
      return result
    }

    // Extract individual fields when full JSON parse fails
    function extractFields(text: string): any {
      const msgMatch = text.match(/"message"\s*:\s*"([\s\S]*?)(?<!\\)",/)
      const confMatch = text.match(/"confidence"\s*:\s*(\d+)/)
      const phaseMatch = text.match(/"phase"\s*:\s*"([^"]+)"/)

      // Try to extract summary block
      let summary = null
      const sumIdx = text.indexOf('"summary"')
      if (sumIdx !== -1) {
        const braceStart = text.indexOf("{", sumIdx + 9)
        if (braceStart !== -1) {
          // Find matching closing brace
          let depth = 0
          let end = -1
          for (let i = braceStart; i < text.length; i++) {
            if (text[i] === "{") depth++
            else if (text[i] === "}") { depth--; if (depth === 0) { end = i; break } }
          }
          if (end !== -1) {
            try { summary = JSON.parse(repairJSON(text.slice(braceStart, end + 1))) } catch {}
          }
        }
      }

      return {
        message: msgMatch ? msgMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : text.trim(),
        confidence: confMatch ? parseInt(confMatch[1]) : (currentConfidence || 50),
        phase: phaseMatch ? phaseMatch[1] : "discovery",
        summary,
      }
    }

    function extractJSON(text: string): any {
      // Strip ```json ... ``` fences
      const stripped = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()

      // 1. Direct parse
      try { return JSON.parse(stripped) } catch {}

      // 2. Repair unescaped newlines then parse
      try { return JSON.parse(repairJSON(stripped)) } catch {}

      // 3. Find outermost { } then repair + parse
      const start = stripped.indexOf("{")
      const end = stripped.lastIndexOf("}")
      if (start !== -1 && end > start) {
        const block = stripped.slice(start, end + 1)
        try { return JSON.parse(block) } catch {}
        try { return JSON.parse(repairJSON(block)) } catch {}
      }

      // 4. Field-level regex extraction
      return extractFields(stripped)
    }

    let parsed: any = extractJSON(raw)

    // If message field itself looks like a full JSON object, unwrap it
    if (typeof parsed.message === "string") {
      const m = parsed.message.trim()
      if (m.startsWith("{") && m.includes('"confidence"')) {
        try {
          const inner = JSON.parse(repairJSON(m))
          if (typeof inner.message === "string") {
            parsed = { ...parsed, ...inner }
          }
        } catch { /* keep as-is */ }
      }
    }

    // Normalise phase
    if (parsed.phase === "generating" || parsed.phase === "generate") parsed.phase = "ready"
    if (!parsed.phase) parsed.phase = (parsed.confidence ?? 0) >= 85 ? "ready" : "discovery"

    // Enforce confidence never goes backwards
    const safeConf = Math.max(parsed.confidence ?? 0, currentConfidence ?? 0)
    parsed.confidence = safeConf

    // Final safety: message must be a non-empty plain string
    if (typeof parsed.message !== "string" || !parsed.message.trim()) {
      parsed.message = "Got it — can you tell me one more thing: what\'s your expected launch timeline or team size?"
    }

    // Enforce markdown-only file generation
    if (parsed.summary && Array.isArray(parsed.summary.filesToGenerate)) {
      const rawFiles = parsed.summary.filesToGenerate as string[]
      parsed.summary.filesToGenerate = rawFiles
        .map(normalizeMarkdownFile)
        .filter((name, idx, arr) => name && arr.indexOf(name) === idx)
    }

    return NextResponse.json({
      ...parsed,
      credits: {
        reserved: aiResult.creditsReserved,
        charged: aiResult.creditsCharged,
        refunded: aiResult.creditsRefunded,
        balance: aiResult.availableBalance,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[architect/chat]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
