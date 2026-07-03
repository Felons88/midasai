import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

function toSkillMdUrl(githubUrl: string): string {
  // Convert any GitHub tree/blob URL to the raw SKILL.md URL
  // e.g. https://github.com/user/repo/tree/main/path  → raw SKILL.md
  //      https://github.com/user/repo/blob/main/path/SKILL.md → same
  let url = githubUrl.trim().replace(/\/$/, "")

  // Already points at SKILL.md
  if (url.toLowerCase().endsWith("skill.md")) {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/")
  }

  // Strip /blob/ or /tree/ and append SKILL.md
  url = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/")
    .replace("/tree/", "/")

  return `${url}/SKILL.md`
}

async function fetchSkillMd(githubUrl: string): Promise<string | null> {
  const rawUrl = toSkillMdUrl(githubUrl)
  try {
    const res = await fetch(rawUrl, {
      headers: { "User-Agent": "MidasAI-Bot/1.0" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 12000) // cap to avoid huge prompts
  } catch {
    return null
  }
}

// OpenRouter free models — 5 different upstream providers in parallel
const OPENROUTER_FREE_MODELS = [
  "cohere/north-mini-code:free",               // Cohere own infra
  "nvidia/nemotron-3-ultra-550b-a55b:free",    // NVIDIA own infra
  "nousresearch/hermes-3-llama-3.1-405b:free", // Together.ai infra
  "meta-llama/llama-3.2-3b-instruct:free",     // Various providers
  "meta-llama/llama-3.3-70b-instruct:free",    // Venice (separate pool)
]

// Hard wall-clock timeout for the entire generation
const GENERATION_TIMEOUT_MS = 25000

async function callOpenRouter(
  model: string,
  userMessage: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://midasai.com",
      "X-Title": "MidasAI",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 2000,
      temperature: 0.2,
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${model} → ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string = data?.choices?.[0]?.message?.content ?? ""
  if (!text) throw new Error(`${model} → empty (finish_reason=${data?.choices?.[0]?.finish_reason})`)
  console.log(`[skill-prompt] winner: ${model}`)
  return text.trim()
}

// Cloudflare Workers AI — completely independent free tier, separate from OpenRouter pools
async function callCloudflare(userMessage: string, signal: AbortSignal): Promise<string> {
  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_AI_TOKEN
  if (!accountId || !apiToken) throw new Error("CF_ACCOUNT_ID or CF_AI_TOKEN not set")

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 2000,
      }),
      signal,
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Cloudflare AI → ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string = data?.result?.response ?? ""
  if (!text) throw new Error("Cloudflare AI → empty response")
  console.log("[skill-prompt] winner: cloudflare/llama-3.1-8b")
  return text.trim()
}

async function generateInstallPrompt(
  skillMd: string,
  skillTitle: string,
  githubUrl: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const userMessage = `You are an expert AI coding assistant helping users install Claude Code skills into their IDE.

The SKILL.md below may be written in any language — translate ALL content to English first, then use it.

Generate a MASTER INSTALL PROMPT that a user can paste directly into Claude Code, VS Code, Cursor, or Windsurf to fully install and configure this skill. The prompt must tell the AI agent exactly what to do.

Write the full prompt without cutting off. Use this exact structure:

---
INSTALL: ${skillTitle}
Source: ${githubUrl}

WHAT THIS SKILL DOES:
[2-3 clear English sentences describing what this skill does, translated if needed]

INSTALLATION INSTRUCTIONS FOR YOUR AI AGENT:
[Complete numbered steps — fetch from GitHub, create/modify files, install dependencies, configure settings]

USAGE:
[Complete description of how to use the skill — commands, triggers, workflows, examples]

DIRECT SKILL URL: ${githubUrl}
---

SKILL.md content (translate to English if not already):
===
${skillMd}
===

Write the COMPLETE prompt. Do not truncate. Output ONLY the text between the --- markers.`

  // Shared abort controller — winner cancels losers immediately
  const ac = new AbortController()
  const errors: string[] = []

  function wrapCall(promise: Promise<string>): Promise<string> {
    return promise.then(text => {
      ac.abort()
      return text
    }).catch(e => {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes("AbortError") && !msg.includes("aborted") && !msg.includes("signal")) {
        errors.push(msg)
        console.warn("[skill-prompt] model failed:", msg)
      }
      throw e
    })
  }

  const result = await Promise.any([
    // OpenRouter: 5 different upstream providers
    ...OPENROUTER_FREE_MODELS.map(model =>
      wrapCall(callOpenRouter(model, userMessage, apiKey, ac.signal))
    ),
    // Cloudflare Workers AI: completely independent free tier
    wrapCall(callCloudflare(userMessage, ac.signal)),
    // Hard timeout sentinel
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timed-out")), GENERATION_TIMEOUT_MS)
    ),
  ]).catch(() => {
    ac.abort()
    throw new Error(
      errors.length
        ? `All providers failed:\n${errors.join("\n")}`
        : "Prompt generation timed out after 25s. Please try again."
    )
  })

  return result
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

const PROMPT_MAX_AGE_DAYS = 4
const PROMPT_MAX_AGE_MS = PROMPT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000

function isPromptFresh(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return false
  return Date.now() - new Date(updatedAt).getTime() <= PROMPT_MAX_AGE_MS
}

function buildPromptPayload(
  row: {
    github_url: string
    skill_md_url?: string | null
    prompt?: string | null
    skill_md_missing?: boolean | null
  },
  cached: boolean,
  refreshed = false
) {
  return {
    success: true,
    githubUrl: row.github_url,
    skillMdUrl: row.skill_md_url ?? null,
    prompt: row.skill_md_missing ? null : (row.prompt ?? null),
    skillMdMissing: Boolean(row.skill_md_missing),
    cached,
    refreshed,
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = createServiceClient()
  const encoder = new TextEncoder()

  // Check cache first
  const { data: cached } = await supabase
    .from("listing_prompts")
    .select("*")
    .eq("listing_id", listingId)
    .single()

  // Fresh cache — return immediately without opening a long stream
  if (cached && isPromptFresh(cached.updated_at)) {
    return new Response(sse("complete", buildPromptPayload(cached, true)), {
      headers: SSE_HEADERS,
    })
  }

  // Fetch listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("title, github_url")
    .eq("id", listingId)
    .eq("status", "ACTIVE")
    .single()

  if (listingError || !listing?.github_url) {
    return NextResponse.json(
      { error: "No GitHub URL for this listing" },
      { status: 400 }
    )
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(sse(event, data)))
        } catch (e) {
          // Stream may have been closed by the client while a background refresh is finishing
          console.warn("[skill-prompt] sse send skipped:", e)
        }
      }

      const startTime = Date.now()
      const expectedMs = GENERATION_TIMEOUT_MS
      const skillMdUrl = toSkillMdUrl(listing.github_url)

      try {
        if (cached) {
          // Stale cache — give the user an instant answer, then refresh in the background
          send("complete", buildPromptPayload(cached, true))

          try {
            send("progress", {
              percent: 10,
              message: "Checking for updated SKILL.md...",
              eta: Math.ceil(expectedMs / 1000),
            })

            const skillMd = await fetchSkillMd(listing.github_url)

            if (!skillMd) {
              await supabase
                .from("listing_prompts")
                .update({
                  github_url: listing.github_url,
                  prompt: "",
                  skill_md_missing: true,
                  skill_md_url: skillMdUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq("listing_id", listingId)

              send(
                "refreshed",
                buildPromptPayload(
                  {
                    github_url: listing.github_url,
                    prompt: "",
                    skill_md_missing: true,
                    skill_md_url: skillMdUrl,
                  },
                  false,
                  true
                )
              )
            } else {
              send("progress", {
                percent: 30,
                message: "Regenerating install prompt...",
                eta: Math.ceil(expectedMs / 1000),
              })

              const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime
                const remaining = Math.max(0, expectedMs - elapsed)
                const percent = Math.min(95, 30 + Math.round((elapsed / expectedMs) * 65))
                send("progress", {
                  percent,
                  message: "Regenerating install prompt...",
                  eta: Math.ceil(remaining / 1000),
                })
              }, 1000)

              const prompt = await generateInstallPrompt(skillMd, listing.title, listing.github_url)
              clearInterval(progressInterval)

              await supabase
                .from("listing_prompts")
                .update({
                  github_url: listing.github_url,
                  prompt,
                  skill_md_missing: false,
                  skill_md_url: skillMdUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq("listing_id", listingId)

              send(
                "refreshed",
                buildPromptPayload(
                  {
                    github_url: listing.github_url,
                    prompt,
                    skill_md_missing: false,
                    skill_md_url: skillMdUrl,
                  },
                  false,
                  true
                )
              )
            }
          } catch (refreshError) {
            const msg = refreshError instanceof Error ? refreshError.message : String(refreshError)
            console.error("[skill-prompt] background refresh failed:", msg)
            send("refresh_error", {
              error: "Could not refresh prompt; the cached version is still available.",
            })
          }

          controller.close()
          return
        }

        // No cache — generate for the first time
        send("progress", {
          percent: 5,
          message: "Fetching SKILL.md from GitHub...",
          eta: Math.ceil(expectedMs / 1000),
        })

        const skillMd = await fetchSkillMd(listing.github_url)

        if (!skillMd) {
          const payload = buildPromptPayload(
            {
              github_url: listing.github_url,
              skill_md_url: skillMdUrl,
              prompt: "",
              skill_md_missing: true,
            },
            false
          )
          await supabase.from("listing_prompts").insert({
            listing_id: listingId,
            github_url: listing.github_url,
            prompt: "",
            skill_md_missing: true,
            skill_md_url: skillMdUrl,
          })
          send("complete", payload)
          controller.close()
          return
        }

        send("progress", {
          percent: 20,
          message: "Generating AI install prompt...",
          eta: Math.ceil(expectedMs / 1000),
        })

        // Progress heartbeat while AI providers are competing
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, expectedMs - elapsed)
          const percent = Math.min(95, 20 + Math.round((elapsed / expectedMs) * 75))
          send("progress", {
            percent,
            message: "Generating AI install prompt...",
            eta: Math.ceil(remaining / 1000),
          })
        }, 1000)

        const prompt = await generateInstallPrompt(skillMd, listing.title, listing.github_url)
        clearInterval(progressInterval)

        await supabase.from("listing_prompts").insert({
          listing_id: listingId,
          github_url: listing.github_url,
          prompt,
          skill_md_missing: false,
          skill_md_url: skillMdUrl,
        })

        send(
          "complete",
          buildPromptPayload(
            {
              github_url: listing.github_url,
              skill_md_url: skillMdUrl,
              prompt,
              skill_md_missing: false,
            },
            false
          )
        )
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error("skill-prompt error:", msg)
        send("error", { error: msg })
      } finally {
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
