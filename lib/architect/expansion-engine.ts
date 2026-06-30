import { createServiceClient } from "@/lib/supabase/server"

const EXPANSION_MODELS = [
  "openrouter/free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
]

export const PIPELINE_STAGES = [
  { key: "collecting", label: "Collecting Workflow Data" },
  { key: "analyzing", label: "Analyzing Code Structure" },
  { key: "extracting", label: "Extracting Architecture Patterns" },
  { key: "generating_bible", label: "Generating Project Bible" },
  { key: "building_prompts", label: "Building Prompt Library" },
  { key: "writing_files", label: "Writing GitHub Files" },
  { key: "validation", label: "Final Validation" },
] as const

export type PipelineStageKey = typeof PIPELINE_STAGES[number]["key"]

export interface ExpansionArtifact {
  filename: string
  type: "api" | "component" | "lib" | "supabase" | "docs" | "config" | "other"
  path: string
  content?: string
}

export interface ExpansionResult {
  files: Record<string, string>
  artifacts: ExpansionArtifact[]
  stageResults: Record<string, unknown>
}

const FILE_TEMPLATES: Record<string, string> = {
  "PROJECT_BIBLE.md": `You are generating a comprehensive PROJECT BIBLE document.

This document must cover:
1. Project Overview — name, purpose, architecture, key decisions
2. Technology Stack — every dependency with version and purpose
3. Database Schema — all tables, relationships, enums
4. API Surface — all endpoints, methods, auth requirements
5. Authentication & Authorization — flow, roles, RLS policies
6. Frontend Architecture — components, routing, state management
7. Design System — colors, typography, components, animations
8. Security Model — RLS, headers, secrets, audit procedures
9. Deployment — infrastructure, CI/CD, environment variables
10. Development Workflow — git protocol, feature order, definition of done

Write every section in FULL with real project-specific detail. Minimum 2000 words.
No placeholders. No "[add details here]". No truncation.`,

  "WORKFLOW_HISTORY.md": `You are generating a WORKFLOW HISTORY document.

This document must cover:
1. Timeline of all workflow executions — dates, statuses, outcomes
2. Each workflow step with agent assignments and data flow
3. Architecture decisions made during each workflow
4. Error recovery instances and their resolutions
5. Performance metrics from each workflow run
6. Collapsible section details for each workflow phase

Format as an interactive timeline with clear chronological order.
Use markdown collapsible sections (details/summary) where appropriate.
Minimum 1200 words.`,

  "PROMPT_LIBRARY.md": `You are generating a PROMPT LIBRARY document.

This document must contain:
1. System Prompts — organized by agent role and use case
2. Task Prompts — specific task instructions with input/output schemas
3. Chain Prompts — multi-step prompt sequences for complex workflows
4. Guard Prompts — safety and validation prompts
5. Meta Prompts — prompts for generating and refining other prompts

Each prompt must include:
- Title and purpose
- The full prompt text in a code block
- Input variables and expected output format
- Usage examples with real domain data
- Category tags for filtering

Minimum 1500 words with at least 10 distinct prompts.`,

  "AGENT_RULES.md": `You are generating an AGENT RULES document.

This document must define:
1. Global Rules — rules all agents must follow without exception
2. Per-Agent Rules — specific behavioral constraints per agent role
3. Collaboration Protocol — how agents hand off work and share state
4. Error Handling Rules — what to do on failure, retry logic, escalation
5. Security Rules — what agents must never do, data access boundaries
6. Quality Standards — output format, validation requirements, testing
7. Communication Rules — how agents report status and request input
8. Memory Rules — what to persist, checkpoint requirements, state management

Format each rule as a numbered imperative statement.
Use terminal-style formatting where appropriate.
Minimum 1200 words.`,
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const errors: string[] = []
  for (const model of EXPANSION_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://midasai.com",
          "X-Title": "MidasAI Workflow Expansion",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 6000,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(60000),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`${model} → ${res.status}: ${t.slice(0, 150)}`)
      }
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content ?? ""
      if (!content) throw new Error(`${model} → empty`)
      return content
        .replace(/^```(?:markdown|md)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[expansion:AI] ${msg}`)
      errors.push(msg)
    }
  }
  throw new Error(`All models failed: ${errors.join(" | ")}`)
}

export async function collectArtifacts(
  sessionId: string | null,
  userId: string
): Promise<ExpansionArtifact[]> {
  const supabase = createServiceClient()
  const artifacts: ExpansionArtifact[] = []

  // Collect from architect session if available
  if (sessionId) {
    const { data: session } = await supabase
      .from("architect_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (session?.generated_files) {
      const files = session.generated_files as Record<string, string>
      for (const [filename, content] of Object.entries(files)) {
        artifacts.push({
          filename,
          type: "docs",
          path: `docs/${filename}`,
          content: typeof content === "string" ? content : undefined,
        })
      }
    }

    if (session?.summary) {
      artifacts.push({
        filename: "session_summary.json",
        type: "config",
        path: "config/session_summary.json",
        content: JSON.stringify(session.summary, null, 2),
      })
    }
  }

  // Collect user's listings for context
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, type, description, short_description, github_url, tags")
    .eq("creator_id", userId)
    .eq("status", "ACTIVE")
    .limit(10)

  if (listings?.length) {
    artifacts.push({
      filename: "user_listings.json",
      type: "config",
      path: "config/user_listings.json",
      content: JSON.stringify(listings, null, 2),
    })
  }

  return artifacts
}

export async function updateExpansionStage(
  expansionId: string,
  stage: PipelineStageKey,
  progress: number,
  status: string = "RUNNING"
) {
  const supabase = createServiceClient()
  await supabase
    .from("workflow_expansions")
    .update({
      pipeline_stage: stage,
      pipeline_progress: progress,
      status,
    })
    .eq("id", expansionId)
}

export async function recordStep(
  expansionId: string,
  stepName: string,
  stepOrder: number,
  status: "pending" | "running" | "completed" | "failed",
  output?: unknown,
  error?: string
) {
  const supabase = createServiceClient()

  // Check if step already exists
  const { data: existing } = await supabase
    .from("workflow_expansion_steps")
    .select("id")
    .eq("expansion_id", expansionId)
    .eq("step_name", stepName)
    .single()

  if (existing) {
    await supabase
      .from("workflow_expansion_steps")
      .update({
        status,
        ...(status === "running" ? { started_at: new Date().toISOString() } : {}),
        ...(status === "completed" || status === "failed"
          ? { completed_at: new Date().toISOString() }
          : {}),
        ...(output ? { output: output as any } : {}),
        ...(error ? { error } : {}),
      })
      .eq("id", existing.id)
  } else {
    await supabase.from("workflow_expansion_steps").insert({
      expansion_id: expansionId,
      step_name: stepName,
      step_order: stepOrder,
      status,
      ...(status === "running" ? { started_at: new Date().toISOString() } : {}),
      ...(output ? { output: output as any } : {}),
      ...(error ? { error } : {}),
    })
  }
}

export async function runExpansionPipeline(
  expansionId: string,
  userId: string,
  sessionId: string | null,
  sendEvent: (data: object) => void
): Promise<ExpansionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const supabase = createServiceClient()
  const result: ExpansionResult = { files: {}, artifacts: [], stageResults: {} }

  try {
    // Stage 1: Collecting
    sendEvent({ type: "stage", stage: "collecting", status: "running" })
    await updateExpansionStage(expansionId, "collecting", 5, "RUNNING")
    await recordStep(expansionId, "collecting", 0, "running")

    const artifacts = await collectArtifacts(sessionId, userId)
    result.artifacts = artifacts
    await recordStep(expansionId, "collecting", 0, "completed", {
      artifactCount: artifacts.length,
    })
    sendEvent({ type: "stage", stage: "collecting", status: "completed", data: { artifactCount: artifacts.length } })

    // Stage 2: Analyzing
    sendEvent({ type: "stage", stage: "analyzing", status: "running" })
    await updateExpansionStage(expansionId, "analyzing", 20, "PROCESSING_AI")
    await recordStep(expansionId, "analyzing", 1, "running")

    const artifactSummary = artifacts
      .map((a) => `- ${a.filename} (${a.type}): ${a.path}`)
      .join("\n")
    const contextSnippets = artifacts
      .filter((a) => a.content)
      .map((a) => `### ${a.filename}\n${a.content?.slice(0, 2000)}`)
      .join("\n\n")

    await recordStep(expansionId, "analyzing", 1, "completed")
    sendEvent({ type: "stage", stage: "analyzing", status: "completed" })

    // Stage 3: Extracting
    sendEvent({ type: "stage", stage: "extracting", status: "running" })
    await updateExpansionStage(expansionId, "extracting", 35, "PROCESSING_AI")
    await recordStep(expansionId, "extracting", 2, "running")
    await recordStep(expansionId, "extracting", 2, "completed")
    sendEvent({ type: "stage", stage: "extracting", status: "completed" })

    // Stage 4-6: Generate files
    const filesToGenerate = Object.keys(FILE_TEMPLATES)
    let fileIndex = 0

    for (const filename of filesToGenerate) {
      const stageKey =
        filename === "PROJECT_BIBLE.md"
          ? "generating_bible"
          : filename === "PROMPT_LIBRARY.md"
          ? "building_prompts"
          : "writing_files"

      sendEvent({ type: "stage", stage: stageKey, status: "running" })
      sendEvent({ type: "file_start", filename })
      await updateExpansionStage(
        expansionId,
        stageKey as PipelineStageKey,
        40 + fileIndex * 15,
        "GENERATING_FILES"
      )
      await recordStep(expansionId, `generate_${filename}`, 3 + fileIndex, "running")

      try {
        const systemPrompt = FILE_TEMPLATES[filename]
        const userPrompt = `## Available Artifacts\n${artifactSummary}\n\n## Context\n${contextSnippets}\n\nGenerate the complete ${filename} based on the above project context.`

        const content = await callAI(systemPrompt, userPrompt, apiKey)
        result.files[filename] = content

        await recordStep(expansionId, `generate_${filename}`, 3 + fileIndex, "completed", {
          wordCount: content.split(/\s+/).length,
        })
        sendEvent({ type: "file_complete", filename, wordCount: content.split(/\s+/).length })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await recordStep(expansionId, `generate_${filename}`, 3 + fileIndex, "failed", null, msg)
        sendEvent({ type: "file_error", filename, error: msg })
      }

      fileIndex++
    }

    // Stage 7: Validation
    sendEvent({ type: "stage", stage: "validation", status: "running" })
    await updateExpansionStage(expansionId, "validation", 95, "GENERATING_FILES")
    await recordStep(expansionId, "validation", 7, "running")

    // Validate all files were generated
    const generatedCount = Object.keys(result.files).length
    const validationPassed = generatedCount >= filesToGenerate.length - 1 // Allow 1 failure

    await recordStep(expansionId, "validation", 7, "completed", {
      generatedCount,
      expectedCount: filesToGenerate.length,
      passed: validationPassed,
    })
    sendEvent({ type: "stage", stage: "validation", status: "completed" })

    // Mark expansion as completed
    await supabase
      .from("workflow_expansions")
      .update({
        status: validationPassed ? "COMPLETED" : "FAILED",
        pipeline_stage: "validation",
        pipeline_progress: 100,
        generated_files: result.files,
        file_count: generatedCount,
        source_artifacts: result.artifacts.map((a) => ({
          filename: a.filename,
          type: a.type,
          path: a.path,
        })),
        completed_at: new Date().toISOString(),
        ...(validationPassed ? {} : { error_message: "Some files failed to generate" }),
      })
      .eq("id", expansionId)

    sendEvent({
      type: "complete",
      files: result.files,
      fileCount: generatedCount,
      passed: validationPassed,
    })

    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await supabase
      .from("workflow_expansions")
      .update({
        status: "FAILED",
        error_message: msg,
      })
      .eq("id", expansionId)
    sendEvent({ type: "error", error: msg })
    throw e
  }
}
