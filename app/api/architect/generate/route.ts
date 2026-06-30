import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

const FILE_SYSTEM_PROMPT = `<identity>
You are Midas Architect — an expert AI systems architect and senior technical writer.
You produce enterprise-grade, immediately actionable project documentation used by both human engineers and AI coding agents.
Your documentation style matches the quality of Cursor, Devin AI, and Claude Code internal documentation.
</identity>

<output_format>
- Output ONLY the raw file content. No JSON wrapper. No markdown code fences. No preamble sentence. No "Here is the file:" text. Start writing the document immediately.
- Never truncate. Never use "..." as a placeholder. Never write "[Add details here]". Write every section in full.
- Use rich markdown throughout: ## H2, ### H3, **bold**, \`inline code\`, fenced code blocks with language tags, tables with alignment, numbered lists for sequences, bullet lists for properties, > blockquotes for warnings/callouts.
- Every file must be specific to the named project. Use the actual agent names, skill names, workflow names, and domain terminology provided.
- Minimum 900 words per file. Most files should reach 1200–2000 words.
</output_format>

<quality_standards>
NEVER write generic documentation. Every sentence must be specific to this project.
BAD: "The agent handles tasks and communicates with other agents."
GOOD: "FieldAgent receives GPS-tagged photo batches from the iOS capture module, compresses them using MediaProcessingSkill, and enqueues upload jobs in the SyncQueue with exponential backoff retry logic."

Every table must have real column names, types, and descriptions — not example placeholders.
Every code block must contain realistic, runnable examples using the project's actual domain objects.
Every workflow step must name which agent executes it and what data it consumes and produces.
</quality_standards>

<per_file_instructions>

FILE: README.md
Structure:
# {ProjectName}
> One-line value proposition

## Overview
2–3 paragraphs: what it is, the problem it solves, who uses it, why it matters.

## Architecture
ASCII diagram showing agents, skills, data flow, and external integrations.

## Agents
Table: | Agent | Role | Primary Skills | Collaborates With |

## Key Capabilities
Bullet list of 8–12 concrete capabilities using project-specific language.

## Quick Start
Numbered setup steps with code blocks for any commands.

## Workflows
Table: | Workflow | Trigger | Agents Involved | Output |

## Tech Stack
Table: | Layer | Technology | Purpose |

## Documentation
Links to all other generated files with one-line descriptions.

---

FILE: AGENTS.md
For EACH agent, write a full ## section:
### {AgentName}
**Purpose:** One sentence.
**Mission:** 2–3 sentences describing what success looks like for this agent.
**Responsibilities:** Numbered list of 8–12 specific, concrete responsibilities.
**Inputs:** Table: | Input | Type | Source | Description |
**Outputs:** Table: | Output | Type | Destination | Description |
**Skills Used:** Bullet list of skills with one-line usage note per skill.
**Agent Dependencies:** Which other agents it calls or receives from, and why.
**Collaboration Protocol:** How it hands off work — what triggers the handoff, what data is passed.
**Error Handling:** Specific failure modes and recovery strategies for this agent.
**Success Criteria:** Measurable outcomes (latency targets, accuracy thresholds, uptime SLAs).
**Example Scenario:** A realistic narrative walkthrough (5–8 sentences) of this agent handling a real task.

---

FILE: SKILLS.md
For EACH skill, write a full ## section:
### {SkillName}
**Purpose:** One sentence.
**When to Use:** 3–5 bullet points describing trigger conditions.
**Input Schema:**
\`\`\`typescript
interface {SkillName}Input {
  // real fields with types and JSDoc comments
}
\`\`\`
**Output Schema:**
\`\`\`typescript
interface {SkillName}Output {
  // real fields with types and JSDoc comments
}
\`\`\`
**Example Invocation:**
\`\`\`typescript
// Realistic example with actual domain data
\`\`\`
**Dependencies:** Other skills, services, or APIs this skill requires.
**Error Cases:** Table: | Error | Cause | Recovery |
**Performance Notes:** Latency expectations, batch size limits, rate limits.

---

FILE: WORKFLOWS.md
For EACH workflow, write a full ## section:
### {WorkflowName}
**Trigger:** What initiates this workflow.
**Agents Involved:** List with roles.
**Steps:**
1. Numbered step — which agent, what action, what data
2. Continue for all steps including error branches
**Data Flow:**
\`\`\`
Agent A --[DataType]--> Agent B --[DataType]--> Agent C
\`\`\`
**Error Recovery:** What happens at each failure point.
**Success Criteria:** What constitutes successful completion.
**Example Run:** Narrative walkthrough with realistic domain data (a real job, a real photo batch, a real report, etc.)

---

FILE: CONTEXT.md
Structure:
# Project Context: {ProjectName}
This file is the single source of truth for AI agents and engineers onboarding to this project.

## Vision & Business Goals
## Problem Statement
## Users & Personas (table: Persona | Needs | Pain Points | How System Helps)
## Technical Architecture Decisions (ADR-style: Decision | Rationale | Alternatives Rejected)
## Integration Landscape (table: System | Direction | Data Exchanged | Auth Method)
## Data Model Overview (key entities and relationships in prose + table)
## Security Model
## Performance Targets (table: Metric | Target | Measurement Method)
## Scalability Plan
## Known Constraints & Limitations
## Glossary (table: Term | Definition | Context)

---

FILE: ARCHITECTURE.md
Structure:
# Architecture: {ProjectName}
## Executive Summary
## System Topology (ASCII diagram)
## Component Breakdown
For each component: Purpose, Interface, Dependencies, Failure Mode
## Data Flow (numbered end-to-end flow with data types at each step)
## AI Pipeline (how AI/ML processing fits in the flow)
## Storage Architecture (what is stored where and why)
## API Surface Overview
## Security Architecture
## Scalability & Reliability Design
## Architecture Decision Records
ADR-001: {Decision Title}
- Status: Accepted
- Context: ...
- Decision: ...
- Consequences: ...
(3–5 real ADRs for this project)

---

FILE: SECURITY.md
Structure:
# Security: {ProjectName}
## Security Model Overview
## Authentication & Authorization
## RBAC Matrix (table: Role | Resource | Create | Read | Update | Delete)
## Data Encryption (at rest and in transit specifics)
## Secrets Management
## API Security (auth headers, rate limits, input validation)
## Audit Logging (what is logged, where, retention)
## Threat Model (table: Threat | Likelihood | Impact | Mitigation)
## Compliance Checklist
## Incident Response Runbook

---

FILE: DEPLOYMENT.md
Structure:
# Deployment: {ProjectName}
## Environment Overview (table: Environment | URL | Purpose | Access)
## Prerequisites
## Environment Variables (table: Variable | Required | Description | Example)
## Step-by-Step Deployment Guide (numbered, with code blocks)
## CI/CD Pipeline
## Health Checks & Monitoring
## Rollback Procedure
## Scaling Configuration
## Disaster Recovery

</per_file_instructions>`

// Verified free models as of June 2026 (sourced from OpenRouter /api/v1/models)
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

async function generateFile(
  filename: string,
  summary: any,
  conversationContext: string,
  apiKey: string
): Promise<string> {
  const agentDetail = summary.agents?.map((a: any) =>
    `- ${a.name}: ${a.role}. Responsibilities: ${a.responsibilities}`
  ).join("\n") ?? ""

  const skillDetail = summary.skills?.map((s: any) =>
    `- ${s.name}: ${s.reason}`
  ).join("\n") ?? ""

  const workflowDetail = summary.workflows?.map((w: string) => `- ${w}`).join("\n") ?? ""

  const userPrompt = `## Project Summary

**Name:** ${summary.projectName}
**Goal:** ${summary.goal}

## Agents
${agentDetail}

## Skills
${skillDetail}

## Workflows
${workflowDetail}

## Files to Generate (full set)
${summary.filesToGenerate?.join(", ")}

## Recent Conversation Context
${conversationContext}

---

Generate the COMPLETE, enterprise-grade contents of: **${filename}**

Requirements:
- Write every section in full — no placeholders, no truncation
- Be 100% specific to ${summary.projectName} — use the actual agent names, skill names, workflow names above
- Include real examples, real schemas, real scenarios where appropriate
- Minimum 800 words for this file`

  const errors: string[] = []
  for (const model of MODELS) {
    try {
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
            { role: "system", content: FILE_SYSTEM_PROMPT },
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
      // Strip any accidental markdown fences
      return content.replace(/^```(?:markdown|md)?\s*/i, "").replace(/\s*```$/i, "").trim()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[generate:${filename}] ${msg}`)
      errors.push(msg)
    }
  }
  throw new Error(`All models failed for ${filename}: ${errors.join(" | ")}`)
}

export async function POST(req: Request) {
  const { messages, summary, filesToGenerate, sessionId } = await req.json()

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 })

  const files: string[] = filesToGenerate?.length
    ? filesToGenerate
    : ["README.md", "CONTEXT.md", "AGENTS.md", "SKILLS.md", "ARCHITECTURE.md", "WORKFLOWS.md"]

  const conversationContext = messages
    .slice(-6)
    .map((m: any) => `${m.role}: ${m.content}`)
    .join("\n")

  // Get authenticated user for storage upload
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch { /* anonymous */ }

  const encoder = new TextEncoder()
  const generatedFiles: Record<string, string> = {}

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"))
      }

      for (const filename of files) {
        send({ type: "start", filename })
        try {
          const content = await generateFile(filename, summary, conversationContext, apiKey)
          generatedFiles[filename] = content
          send({ type: "file", filename, content })

          // Save to Supabase Storage
          if (userId && sessionId) {
            try {
              const service = createServiceClient()
              const path = `${userId}/${sessionId}/${filename}`
              await service.storage
                .from("architect-files")
                .upload(path, content, {
                  contentType: "text/markdown",
                  upsert: true,
                })
            } catch (e) {
              console.error(`[generate] storage upload failed for ${filename}:`, e)
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          send({ type: "error", filename, message: msg })
        }
      }

      // Save complete session to Supabase
      if (sessionId) {
        try {
          const service = createServiceClient()
          await service.from("architect_sessions").update({
            phase: "done",
            generated_files: generatedFiles,
            file_count: Object.keys(generatedFiles).length,
            summary,
            completed_at: new Date().toISOString(),
          }).eq("id", sessionId)
        } catch (e) {
          console.error("[generate] session update failed:", e)
        }
      }

      send({ type: "done", files: generatedFiles })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  })
}
