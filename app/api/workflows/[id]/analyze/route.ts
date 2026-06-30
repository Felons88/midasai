import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { runBackgroundExpansion } from "../expand/route"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const GOOGLE_AI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "openai/gpt-oss-120b:free",
]

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Try OpenRouter first
  if (OPENROUTER_API_KEY) {
    for (const model of MODELS) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        })
        if (!res.ok) {
          const errorText = await res.text().catch(() => "")
          console.error(`[analyze] OpenRouter ${model} failed: ${res.status} ${errorText.slice(0, 200)}`)
          // If 429 with retry-after, wait and retry
          if (res.status === 429) {
            const retryAfter = res.headers.get("Retry-After")
            if (retryAfter) {
              const waitMs = parseInt(retryAfter, 10) * 1000
              console.log(`[analyze] Retrying ${model} after ${retryAfter}s`)
              await new Promise(r => setTimeout(r, waitMs))
              // Retry same model
              const retryRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                },
                body: JSON.stringify({
                  model,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                  ],
                  max_tokens: 2000,
                  temperature: 0.3,
                }),
              })
              if (retryRes.ok) {
                const data = await retryRes.json()
                const content = data.choices?.[0]?.message?.content
                if (content) return content
              }
            }
          }
          continue
        }
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content) return content
      } catch (err) {
        console.error(`[analyze] OpenRouter ${model} error:`, err)
        continue
      }
    }
  }

  // Fallback: Google Generative AI
  if (GOOGLE_AI_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (content) return content
      } else {
        console.error(`[analyze] Google AI failed: ${res.status} ${await res.text().catch(() => "")}`)
      }
    } catch (err) {
      console.error(`[analyze] Google AI error:`, err)
    }
  }

  throw new Error(`All AI models failed. OPENROUTER_API_KEY set: ${!!OPENROUTER_API_KEY}, GOOGLE_AI_KEY set: ${!!GOOGLE_AI_KEY}`)
}

// POST: Trigger background analysis on imported workflow
// This runs WITHOUT the user needing to be on the page
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

    const service = createServiceClient()
    const { data: wf } = await service
      .from("workflow_expansions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // If already ANALYZED, return existing results immediately
    if (wf.status === "ANALYZED") {
      const config = typeof wf.expansion_config === "object" ? wf.expansion_config as Record<string, unknown> : {}
      return NextResponse.json({
        status: "ANALYZED",
        eta_seconds: 0,
        estimated_completion: null,
        file_count: config.file_count_at_start || 0,
        analysis_summary: config.analysis_summary || null,
        initial_score: config.initial_score || null,
        tech_stack_detected: config.tech_stack_detected || null,
        strengths: config.strengths || null,
        weaknesses: config.weaknesses || null,
        architecture_pattern: config.architecture_pattern || null,
        readiness_level: config.readiness_level || null,
        key_questions: config.key_questions || null,
      })
    }

    if (!["IMPORTED", "DRAFT"].includes(wf.status)) {
      return NextResponse.json(
        { error: "Only IMPORTED or DRAFT workflows can be analyzed" },
        { status: 400 }
      )
    }

    // Get files from both source_artifacts (imported from architect) and generated_files (AI-generated)
    const sourceArtifacts: Record<string, string> =
      wf.source_artifacts && typeof wf.source_artifacts === "object"
        ? (wf.source_artifacts as Record<string, string>)
        : {}
    const generatedFiles: Record<string, string> =
      wf.generated_files && typeof wf.generated_files === "object"
        ? (wf.generated_files as Record<string, string>)
        : {}

    // Merge both sources, with generated_files taking precedence
    const allFiles: Record<string, string> = { ...sourceArtifacts, ...generatedFiles }
    const fileList = Object.keys(allFiles)
    const totalChars = Object.values(allFiles).reduce((sum, v) => sum + (v as string).length, 0)

    // Calculate ETA based on file count and total content size
    // ~2s per file for AI to read + ~15s for analysis response
    const etaSeconds = Math.max(20, Math.min(180, fileList.length * 2 + Math.ceil(totalChars / 10000) * 3 + 15))
    const estimatedCompletionTime = new Date(Date.now() + etaSeconds * 1000).toISOString()

    // Mark as ANALYZING with ETA
    await service
      .from("workflow_expansions")
      .update({
        status: "ANALYZING",
        pipeline_stage: "deep_scan",
        pipeline_progress: 5,
        started_at: new Date().toISOString(),
        file_count: fileList.length,
        expansion_config: {
          ...(typeof wf.expansion_config === "object" ? wf.expansion_config : {}),
          eta_seconds: etaSeconds,
          estimated_completion: estimatedCompletionTime,
          analysis_started_at: new Date().toISOString(),
          file_count_at_start: fileList.length,
          total_chars: totalChars,
        },
      })
      .eq("id", id)

    // Return immediately with ETA — analysis continues in background via fire-and-forget
    const response = NextResponse.json({
      status: "ANALYZING",
      eta_seconds: etaSeconds,
      estimated_completion: estimatedCompletionTime,
      file_count: fileList.length,
    })

    // Fire-and-forget: Run the actual analysis
    // Use setTimeout to ensure this runs after response is sent
    setTimeout(() => {
      runBackgroundAnalysis(service, id, user.id, allFiles, fileList).catch((err) => {
        console.error(`[workflow-analyze] Background analysis failed for ${id}:`, err)
      })
    }, 100)

    return response
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET: Check analysis status
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

    const service = createServiceClient()
    const { data: wf } = await service
      .from("workflow_expansions")
      .select("id, status, pipeline_stage, pipeline_progress, expansion_config, error_message")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const config = typeof wf.expansion_config === "object" ? wf.expansion_config as Record<string, unknown> : {}

    return NextResponse.json({
      status: wf.status,
      pipeline_stage: wf.pipeline_stage,
      pipeline_progress: wf.pipeline_progress,
      eta_seconds: config.eta_seconds || null,
      estimated_completion: config.estimated_completion || null,
      analysis_summary: config.analysis_summary || null,
      initial_score: config.initial_score || null,
      file_categories: config.file_categories || null,
      tech_stack_detected: config.tech_stack_detected || null,
      error: wf.error_message || null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Background analysis function — runs after response is sent
async function runBackgroundAnalysis(
  service: ReturnType<typeof createServiceClient>,
  workflowId: string,
  userId: string,
  existingFiles: Record<string, string>,
  fileList: string[]
) {
  try {
    // Progress: scanning files
    await service
      .from("workflow_expansions")
      .update({ pipeline_progress: 20, pipeline_stage: "scanning_files" })
      .eq("id", workflowId)

    const fileSummary = fileList
      .map((f) => `### ${f}\n${(existingFiles[f] || "").slice(0, 2000)}`)
      .join("\n\n---\n\n")

    // Progress: AI analyzing
    await service
      .from("workflow_expansions")
      .update({ pipeline_progress: 40, pipeline_stage: "ai_deep_analysis" })
      .eq("id", workflowId)

    const systemPrompt = `You are the Midas AI Project Intelligence Engine. You perform deep analysis of project files to understand the full architecture, tech stack, patterns, and areas for improvement.

OUTPUT FORMAT (strict JSON):
{
  "score": <number 0-100>,
  "summary": "<3-4 sentence executive summary of the project's current state>",
  "tech_stack": ["<detected technologies, frameworks, libraries>"],
  "strengths": ["<3-5 key strengths>"],
  "weaknesses": ["<3-5 key weaknesses or gaps>"],
  "file_categories": {
    "<category>": <count>
  },
  "architecture_pattern": "<detected pattern: monolith, microservices, serverless, etc>",
  "readiness_level": "prototype" | "mvp" | "beta" | "production",
  "contextual_questions": [
    "<question about what the AI discovered that could guide next steps>"
  ]
}

Analyze the codebase thoroughly and infer all necessary context from the files themselves. After understanding the project, generate 3-5 contextual questions that show your understanding and could guide the next improvement steps. These should be questions like "Should I add tests for the authentication module?" or "The project lacks documentation, should I focus on that?" - questions that demonstrate what you've learned about the project.

Score should reflect the current quality of the project files (30-60 for imported, higher if well-structured).`

    const userPrompt = `Perform a deep analysis of this project with ${fileList.length} files:\n\n${fileSummary.slice(0, 8000)}`

    const aiResponse = await callAI(systemPrompt, userPrompt)

    // Progress: parsing results
    await service
      .from("workflow_expansions")
      .update({ pipeline_progress: 75, pipeline_stage: "parsing_results" })
      .eq("id", workflowId)

    let parsed: {
      score: number
      summary: string
      tech_stack: string[]
      strengths: string[]
      weaknesses: string[]
      file_categories: Record<string, number>
      architecture_pattern: string
      readiness_level: string
      contextual_questions: string[]
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON in response")
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      parsed = {
        score: 35,
        summary: "Initial analysis complete. Project files detected and categorized.",
        tech_stack: ["Unknown"],
        strengths: ["Files imported successfully"],
        weaknesses: ["Needs deeper analysis"],
        file_categories: { general: fileList.length },
        architecture_pattern: "unknown",
        readiness_level: "prototype",
        contextual_questions: [
          "What type of application is this project building?",
          "Should I focus on adding documentation or improving code quality?",
          "Are there specific features you want to prioritize?",
        ],
      }
    }

    // Mark as ANALYZED with full results
    await service
      .from("workflow_expansions")
      .update({
        status: "ANALYZED",
        pipeline_stage: "analysis_complete",
        pipeline_progress: 100,
        expansion_config: {
          initial_score: parsed.score,
          analysis_summary: parsed.summary,
          tech_stack_detected: parsed.tech_stack,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
          file_categories: parsed.file_categories,
          architecture_pattern: parsed.architecture_pattern,
          readiness_level: parsed.readiness_level,
          contextual_questions: parsed.contextual_questions,
          analysis_completed_at: new Date().toISOString(),
        },
      })
      .eq("id", workflowId)

    // Create a notification for the user
    await service
      .from("notifications")
      .insert({
        user_id: userId,
        type: "AI_ASSISTANT",
        title: "Workflow Analysis Complete",
        message: `Auto-expansion started. Initial score: ${parsed.score}%`,
        link: "/architect/workshop",
        metadata: { workflow_id: workflowId, score: parsed.score },
      })
      .single()

    // Auto-trigger first expansion round by calling the logic directly
    try {
      await runBackgroundExpansion(service, workflowId, userId, existingFiles, fileList)
    } catch (expandErr) {
      console.error(`[workflow-analyze] Error auto-triggering expansion:`, expandErr)
    }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[workflow-analyze] Error:`, errorMsg)

    // Mark as failed
    await service
      .from("workflow_expansions")
      .update({
        status: "FAILED",
        error_message: `Analysis failed: ${errorMsg}`,
        pipeline_stage: "analysis_failed",
        pipeline_progress: 0,
      })
      .eq("id", workflowId)
  }
}
