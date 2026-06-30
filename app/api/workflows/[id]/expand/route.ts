import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

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
            temperature: 0.4,
          }),
        })
        if (!res.ok) {
          const errorText = await res.text().catch(() => "")
          console.error(`[expand] OpenRouter ${model} failed: ${res.status} ${errorText.slice(0, 200)}`)
          // If 429 with retry-after, wait and retry
          if (res.status === 429) {
            const retryAfter = res.headers.get("Retry-After")
            if (retryAfter) {
              const waitMs = parseInt(retryAfter, 10) * 1000
              console.log(`[expand] Retrying ${model} after ${retryAfter}s`)
              await new Promise(r => setTimeout(r, waitMs))
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
                  temperature: 0.4,
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
      } catch {
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
            generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (content) return content
      }
    } catch {
      // fall through
    }
  }

  throw new Error("All AI models failed")
}

// Background expansion function — runs after analysis completes
export async function runBackgroundExpansion(
  service: ReturnType<typeof createServiceClient>,
  workflowId: string,
  userId: string,
  existingFiles: Record<string, string>,
  fileList: string[]
) {
  try {
    const { data: wf } = await service
      .from("workflow_expansions")
      .select("*")
      .eq("id", workflowId)
      .single()

    if (!wf) throw new Error("Workflow not found")

    const currentRound = (wf.expansion_config as any)?.rounds_completed || 0
    const fileSummary = fileList.map((f) => `### ${f}\n${(existingFiles[f] || "").slice(0, 1500)}`).join("\n\n---\n\n")

    // Mark as processing
    await service
      .from("workflow_expansions")
      .update({
        status: "PROCESSING_AI",
        pipeline_stage: `analysis_round_${currentRound + 1}`,
        pipeline_progress: Math.min(15 + currentRound * 15, 85),
      })
      .eq("id", workflowId)

    const systemPrompt = `You are the Midas AI Project Architecture Engine. You analyze project files and suggest improvements to increase the project score.

Current round: ${currentRound + 1}
File count: ${fileList.length}

OUTPUT FORMAT (strict JSON):
{
  "score": <number 0-100>,
  "analysis": "<detailed analysis of current state and what needs improvement>",
  "suggestions": [
    {
      "id": "<short_id>",
      "title": "<short descriptive title>",
      "description": "<detailed explanation of what to do>",
      "target_file": "<file path or NEW_FILE:filename>",
      "priority": "high" | "medium" | "low",
      "category": "architecture" | "code_quality" | "documentation" | "testing" | "performance" | "security"
    }
  ],
  "quick_actions": [
    {
      "id": "<short_id>",
      "label": "<short button label, 2-4 words>",
      "guidance": "<what the user wants to focus on when this button is clicked>",
      "icon": "code" | "docs" | "test" | "security" | "perf" | "deploy"
    }
  ]
}

Provide 3-5 actionable suggestions. Also provide 3-4 quick action buttons that the user can click to guide the next round of improvements. These should be high-level directions like "Focus on documentation", "Add tests", "Improve performance", etc.`

    const userPrompt = `Analyze this project and suggest improvements:\n\n${fileSummary.slice(0, 8000)}`

    const aiResponse = await callAI(systemPrompt, userPrompt)

    let parsed: {
      score: number
      analysis: string
      suggestions: { id: string; title: string; description: string; target_file: string; priority: string; category: string }[]
      quick_actions: { id: string; label: string; guidance: string; icon: string }[]
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON in response")
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      parsed = {
        score: 40,
        analysis: "Analysis complete. Ready to begin improvements.",
        suggestions: [
          {
            id: "s1",
            title: "Add README documentation",
            description: "Create a comprehensive README.md with project overview, installation instructions, and usage examples.",
            target_file: "NEW_FILE:README.md",
            priority: "high",
            category: "documentation",
          },
        ],
        quick_actions: [
          { id: "qa1", label: "Add Documentation", guidance: "Focus on improving documentation and README files", icon: "docs" },
          { id: "qa2", label: "Add Tests", guidance: "Focus on adding unit tests and test coverage", icon: "test" },
          { id: "qa3", label: "Improve Code", guidance: "Focus on code quality and refactoring", icon: "code" },
        ],
      }
    }

    // Update pipeline progress and save chat message
    const existingConfig = typeof wf.expansion_config === "object" ? wf.expansion_config as Record<string, unknown> : {}
    const existingMessages = Array.isArray(existingConfig.chat_messages) ? existingConfig.chat_messages : []

    const newMessage = {
      id: `msg-${Date.now()}`,
      role: "ai" as const,
      content: parsed.analysis,
      score: parsed.score,
      suggestions: parsed.suggestions,
      quick_actions: parsed.quick_actions,
      round: currentRound + 1,
      timestamp: new Date().toISOString(),
    }

    await service
      .from("workflow_expansions")
      .update({
        status: "PROCESSING_AI",
        pipeline_progress: Math.min(20 + currentRound * 15, 85),
        expansion_config: {
          ...existingConfig,
          last_score: parsed.score,
          rounds_completed: currentRound + 1,
          chat_messages: [...existingMessages, newMessage],
        },
      })
      .eq("id", workflowId)

    // Auto-apply first suggestion if this is round 1
    if (currentRound === 0 && parsed.suggestions.length > 0) {
      applySuggestionBackground(service, workflowId, parsed.suggestions[0], currentRound + 1).catch((err) => {
        console.error(`[expand] Failed to auto-apply suggestion:`, err)
      })
    }

    console.log(`[expand] Background expansion complete for ${workflowId}`)
  } catch (err) {
    console.error(`[expand] Background expansion error:`, err)
  }
}

// POST: Start or continue expansion — analyze files, suggest fixes, track score
export async function POST(
  req: Request,
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

    if (!["DRAFT", "FAILED", "IMPORTED", "ANALYZED", "PROCESSING_AI"].includes(wf.status)) {
      return NextResponse.json(
        { error: "Only DRAFT, IMPORTED, ANALYZED, FAILED, or in-progress workflows can be expanded" },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const userGuidance: string = body.guidance || ""
    const currentRound: number = body.round || 0

    // Save user message to chat history if provided
    if (userGuidance) {
      const existingConfig = typeof wf.expansion_config === "object" ? wf.expansion_config as Record<string, unknown> : {}
      const existingMessages = Array.isArray(existingConfig.chat_messages) ? existingConfig.chat_messages : []

      const userMessage = {
        id: `msg-${Date.now()}`,
        role: "user" as const,
        content: userGuidance,
        round: currentRound,
        timestamp: new Date().toISOString(),
      }

      await service
        .from("workflow_expansions")
        .update({
          expansion_config: {
            ...existingConfig,
            chat_messages: [...existingMessages, userMessage],
          },
        })
        .eq("id", id)
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
    const fileCount = fileList.length > 0 ? fileList.length : (wf.expansion_config as any)?.file_count_at_start || 0
    const fileSummary = fileList.length > 0
      ? fileList.map((f) => `### ${f}\n${(allFiles[f] || "").slice(0, 1500)}`).join("\n\n---\n\n")
      : `(No files available. Original file count: ${fileCount})`

    // Mark as processing
    await service
      .from("workflow_expansions")
      .update({
        status: "PROCESSING_AI",
        pipeline_stage: `analysis_round_${currentRound + 1}`,
        pipeline_progress: Math.min(15 + currentRound * 15, 85),
      })
      .eq("id", id)

    const systemPrompt = `You are the Midas AI Project Architecture Engine. You analyze project files and suggest improvements to transform them into industry-grade, production-ready architecture documentation.

RULES:
- You NEVER delete or overwrite existing content
- You ONLY suggest additive improvements
- You think like a Stripe/Vercel/OpenAI system architect
- Every suggestion must be concrete and actionable
- You track a quality score from 0-100

OUTPUT FORMAT (strict JSON):
{
  "score": <number 0-100>,
  "analysis": "<brief 1-2 sentence assessment of current state>",
  "suggestions": [
    {
      "id": "<short_id>",
      "title": "<clear title>",
      "description": "<what to improve and why>",
      "target_file": "<filename to modify or NEW_FILE:filename.md>",
      "priority": "critical" | "high" | "medium",
      "category": "architecture" | "security" | "scaling" | "documentation" | "ai_orchestration" | "observability"
    }
  ]
}

Return EXACTLY 3 suggestions per round. Score should start around 30-50 for imported files and increase as improvements are applied.`

    const userMsg = currentRound === 0
      ? `Analyze these project files and provide your initial assessment with 3 improvement suggestions:\n\n${fileSummary}`
      : `Previous round improvements have been applied. The user provides this guidance: "${userGuidance}"\n\nHere are the current files:\n\n${fileSummary}\n\nProvide 3 new improvement suggestions. Score should reflect cumulative improvements.`

    const aiResponse = await callAI(systemPrompt, userMsg)

    // Parse AI response
    let parsed: {
      score: number
      analysis: string
      suggestions: {
        id: string
        title: string
        description: string
        target_file: string
        priority: string
        category: string
      }[]
      quick_actions: { id: string; label: string; guidance: string; icon: string }[]
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON in response")
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      parsed = {
        score: 30 + currentRound * 10,
        analysis: "Analysis in progress...",
        suggestions: [
          { id: "s1", title: "Review architecture patterns", description: "Analyze and improve overall architecture structure", target_file: "PROJECT_BIBLE.md", priority: "high", category: "architecture" },
          { id: "s2", title: "Add security model", description: "Define RBAC, RLS, and API security layers", target_file: "NEW_FILE:SECURITY_MODEL.md", priority: "critical", category: "security" },
          { id: "s3", title: "Add scaling strategy", description: "Define horizontal scaling, caching, and performance model", target_file: "NEW_FILE:SCALING_STRATEGY.md", priority: "high", category: "scaling" },
        ],
        quick_actions: [
          { id: "qa1", label: "Focus on Architecture", guidance: "Focus on improving architecture patterns and structure", icon: "code" },
          { id: "qa2", label: "Add Security", guidance: "Focus on security, RBAC, and RLS policies", icon: "security" },
          { id: "qa3", label: "Improve Performance", guidance: "Focus on performance optimization and scaling", icon: "perf" },
        ],
      }
    }

    // Update pipeline progress and save chat message
    const existingConfig = typeof wf.expansion_config === "object" ? wf.expansion_config as Record<string, unknown> : {}
    const existingMessages = Array.isArray(existingConfig.chat_messages) ? existingConfig.chat_messages : []

    const newMessage = {
      id: `msg-${Date.now()}`,
      role: "ai" as const,
      content: parsed.analysis,
      score: parsed.score,
      suggestions: parsed.suggestions,
      quick_actions: parsed.quick_actions,
      round: currentRound + 1,
      timestamp: new Date().toISOString(),
    }

    await service
      .from("workflow_expansions")
      .update({
        status: "PROCESSING_AI",
        pipeline_progress: Math.min(20 + currentRound * 15, 85),
        expansion_config: {
          ...existingConfig,
          last_score: parsed.score,
          rounds_completed: currentRound + 1,
          chat_messages: [...existingMessages, newMessage],
        },
      })
      .eq("id", id)

    const response = NextResponse.json({
      round: currentRound + 1,
      score: parsed.score,
      analysis: parsed.analysis,
      suggestions: parsed.suggestions,
      fileCount: fileCount,
      isComplete: parsed.score >= 90,
    })

    // Auto-apply first suggestion if this is round 1 (first expansion after analysis)
    if (currentRound === 0 && parsed.suggestions.length > 0) {
      // Fire-and-forget: apply first suggestion
      applySuggestionBackground(service, id, parsed.suggestions[0], currentRound + 1).catch((err) => {
        console.error(`[expand] Failed to auto-apply suggestion:`, err)
      })
    }

    return response
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Background function to apply a suggestion
async function applySuggestionBackground(
  service: ReturnType<typeof createServiceClient>,
  workflowId: string,
  suggestion: any,
  round: number
) {
  try {
    // Generate content for the suggestion
    const systemPrompt = `You are the Midas AI Project Architecture Engine. You generate high-quality, production-ready documentation and code improvements.

Generate the content for this suggestion:
Title: ${suggestion.title}
Description: ${suggestion.description}
Target: ${suggestion.target_file}
Priority: ${suggestion.priority}
Category: ${suggestion.category}

OUTPUT FORMAT:
Return ONLY the content to be written to the file. No markdown code blocks, no explanations, just the raw content.`

    const userPrompt = `Generate the content for: ${suggestion.title}\n\n${suggestion.description}`

    const aiResponse = await callAI(systemPrompt, userPrompt)

    // Update the workflow with the generated content
    const existingConfig = (await service.from("workflow_expansions").select("expansion_config, generated_files").eq("id", workflowId).single()).data
    const config = typeof existingConfig?.expansion_config === "object" ? existingConfig.expansion_config as Record<string, unknown> : {}
    const generatedFiles = typeof existingConfig?.generated_files === "object" ? existingConfig.generated_files as Record<string, string> : {}

    const targetFile = suggestion.target_file.startsWith("NEW_FILE:") ? suggestion.target_file.replace("NEW_FILE:", "") : suggestion.target_file
    generatedFiles[targetFile] = aiResponse

    await service
      .from("workflow_expansions")
      .update({
        generated_files: generatedFiles,
        expansion_config: {
          ...config,
          last_applied_suggestion: suggestion.id,
          applied_count: (config.applied_count as number || 0) + 1,
        },
      })
      .eq("id", workflowId)

    console.log(`[expand] Auto-applied suggestion: ${suggestion.id}`)
  } catch (err) {
    console.error(`[expand] Error applying suggestion:`, err)
  }
}

// PUT: Apply a suggestion — AI generates the content and updates the workflow files
export async function PUT(
  req: Request,
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

    const body = await req.json()
    const { suggestion } = body

    if (!suggestion?.title || !suggestion?.target_file) {
      return NextResponse.json({ error: "Invalid suggestion" }, { status: 400 })
    }

    const existingFiles: Record<string, string> =
      wf.generated_files && typeof wf.generated_files === "object"
        ? (wf.generated_files as Record<string, string>)
        : {}

    const isNewFile = suggestion.target_file.startsWith("NEW_FILE:")
    const targetFile = isNewFile
      ? suggestion.target_file.replace("NEW_FILE:", "")
      : suggestion.target_file

    const existingContent = existingFiles[targetFile] || ""

    const systemPrompt = `You are the Midas AI Architecture Engine. Generate high-quality, industry-grade markdown documentation.

RULES:
- If improving an existing file, ADD new sections — NEVER delete existing content
- If creating a new file, produce comprehensive, production-ready documentation
- Think like Stripe, Vercel, Linear — world-class engineering documentation
- Use proper markdown with headers, tables, code blocks where appropriate
- Be thorough — this is a master source of truth document
- Include practical examples and actionable specifications

Output ONLY the file content — no wrapping, no explanations, just the markdown.`

    const userMsg = isNewFile
      ? `Create a new file "${targetFile}" for this project.\n\nSuggestion: ${suggestion.title}\nDescription: ${suggestion.description}\nCategory: ${suggestion.category}\n\nProject context from existing files:\n${Object.entries(existingFiles).map(([k, v]) => `${k}: ${(v as string).slice(0, 500)}`).join("\n\n")}`
      : `Improve the file "${targetFile}" by applying this suggestion:\n\nSuggestion: ${suggestion.title}\nDescription: ${suggestion.description}\nCategory: ${suggestion.category}\n\nCurrent file content:\n${existingContent}\n\nADD new sections and improvements — do NOT remove anything. Output the complete updated file.`

    const generatedContent = await callAI(systemPrompt, userMsg)

    // Update files in DB
    const updatedFiles = { ...existingFiles, [targetFile]: generatedContent }

    await service
      .from("workflow_expansions")
      .update({
        generated_files: updatedFiles,
        file_count: Object.keys(updatedFiles).length,
        pipeline_stage: `applied_${suggestion.id}`,
      })
      .eq("id", id)

    return NextResponse.json({
      success: true,
      filename: targetFile,
      wordCount: generatedContent.split(/\s+/).length,
      totalFiles: Object.keys(updatedFiles).length,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH: Finalize expansion — generate 72 .md files and mark COMPLETED
// Uses streaming response to report progress as each batch completes
export async function PATCH(
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

    const { EXPANSION_MANIFEST } = await import("@/lib/architect/expansion-manifest")

    const existingFiles: Record<string, string> =
      wf.generated_files && typeof wf.generated_files === "object"
        ? (wf.generated_files as Record<string, string>)
        : {}

    const fileSummary = Object.entries(existingFiles)
      .map(([k, v]) => `### ${k}\n${(v as string).slice(0, 600)}`)
      .join("\n\n---\n\n")

    // Filter out files that already exist
    const filesToGenerate = EXPANSION_MANIFEST.filter(
      (f) => !existingFiles[f.name]
    )

    // Mark as generating
    await service
      .from("workflow_expansions")
      .update({
        status: "GENERATING_FILES",
        pipeline_stage: "generating_docs",
        pipeline_progress: 88,
      })
      .eq("id", id)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"))
          } catch { /* stream closed */ }
        }

        const updatedFiles = { ...existingFiles }
        let completed = 0
        const total = filesToGenerate.length

        send({ type: "start", total, existing: Object.keys(existingFiles).length })

        // Batch files: generate 3 at a time concurrently for speed
        const BATCH_SIZE = 3
        for (let i = 0; i < filesToGenerate.length; i += BATCH_SIZE) {
          const batch = filesToGenerate.slice(i, i + BATCH_SIZE)

          const batchResults = await Promise.allSettled(
            batch.map(async (doc) => {
              send({ type: "file_start", filename: doc.name, category: doc.category })

              const systemPrompt = `You are the Midas AI Architecture Engine. Generate a single comprehensive, production-grade markdown document. Output ONLY the markdown content — no wrapping text, no explanations. Use proper headers (##, ###), tables, code blocks, and bullet points. Be thorough, specific, and actionable. Think like Stripe/Vercel/Linear documentation engineers.\n\nCRITICAL: Analyze the project context files carefully to determine the EXACT tech stack, frameworks, libraries, database, hosting, and services the user's project uses. All documentation must be specific to THEIR project — not generic. If they use Next.js, write Next.js docs. If they use Supabase, write Supabase docs. If they use Stripe, write Stripe docs. Infer everything from the file contents.`

              const userPrompt = `Generate the file "${doc.name}" for this project.\n\nPurpose: ${doc.prompt}\n\nProject context from existing files (analyze these to determine the exact tech stack and architecture):\n${fileSummary.slice(0, 4000)}`

              try {
                const content = await callAI(systemPrompt, userPrompt)
                return { name: doc.name, content, success: true }
              } catch {
                return {
                  name: doc.name,
                  content: `# ${doc.name}\n\n> Generation pending — retry expansion to regenerate this file.\n\n## Purpose\n\n${doc.prompt}`,
                  success: false,
                }
              }
            })
          )

          for (const result of batchResults) {
            if (result.status === "fulfilled") {
              const { name, content, success } = result.value
              updatedFiles[name] = content
              completed++
              const wordCount = content.split(/\s+/).length
              send({
                type: "file_complete",
                filename: name,
                wordCount,
                success,
                completed,
                total,
                progress: Math.round((completed / total) * 100),
              })
            } else {
              completed++
              send({ type: "file_error", completed, total })
            }
          }

          // Persist progress periodically (every 2 batches)
          if ((i / BATCH_SIZE) % 2 === 0 || i + BATCH_SIZE >= filesToGenerate.length) {
            await service
              .from("workflow_expansions")
              .update({
                generated_files: updatedFiles,
                file_count: Object.keys(updatedFiles).length,
                pipeline_progress: Math.round(88 + (completed / total) * 12),
              })
              .eq("id", id)
          }
        }

        // Final update — mark COMPLETED
        await service
          .from("workflow_expansions")
          .update({
            status: "COMPLETED",
            generated_files: updatedFiles,
            file_count: Object.keys(updatedFiles).length,
            pipeline_stage: "finalized",
            pipeline_progress: 100,
            completed_at: new Date().toISOString(),
          })
          .eq("id", id)

        send({
          type: "complete",
          totalFiles: Object.keys(updatedFiles).length,
          files: Object.keys(updatedFiles),
        })

        try { controller.close() } catch { /* already closed */ }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
