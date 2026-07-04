import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"
import { executeWorkflow } from "@/lib/nexus/executor"

// ─── Security helpers ─────────────────────────────────────────────────────────

// In-memory rate limit store: { userId → { count, windowStart } }
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 10 // executions per window
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(userId: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    return { ok: true, retryAfterSec: 0 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000)
    return { ok: false, retryAfterSec }
  }
  entry.count++
  return { ok: true, retryAfterSec: 0 }
}

// SSRF protection: block requests to private/loopback addresses
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /metadata\.google\.internal/i,
  /169\.254\.169\.254/,
]

function isSsrfUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    return PRIVATE_IP_PATTERNS.some(p => p.test(host))
  } catch {
    return true // Malformed URL is also blocked
  }
}

function validateWorkflowSchema(definition: { nodes?: unknown[]; edges?: unknown[] }): string | null {
  const nodes = definition.nodes ?? []
  const edges = definition.edges ?? []
  if (nodes.length > 100) return "Workflow exceeds maximum of 100 nodes"
  if (edges.length > 500) return "Workflow exceeds maximum of 500 connections"
  // Check for SSRF in http_request nodes
  for (const node of nodes) {
    const n = node as { node_type_id?: string; configuration?: Record<string, unknown> }
    if (n.node_type_id === "http_request" && n.configuration?.url) {
      const url = String(n.configuration.url)
      if (!url.startsWith("{{") && isSsrfUrl(url)) {
        return `Node contains blocked URL (private/loopback address): ${url}`
      }
    }
  }
  return null
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limit check
  const rl = checkRateLimit(user.id)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s (max ${RATE_LIMIT_MAX} executions/minute)` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const svc = createNexusService(supabase, user.id)

    // Verify workflow exists and belongs to user
    const workflow = await svc.getWorkflow(id)

    // Schema validation + security scan
    const schemaError = validateWorkflowSchema(workflow.definition ?? {})
    if (schemaError) {
      return NextResponse.json({ error: schemaError }, { status: 400 })
    }

    if (!workflow.definition?.nodes?.length) {
      return NextResponse.json({ error: "Workflow has no nodes" }, { status: 400 })
    }

    // Create execution record
    const execution = await svc.createExecution(id, body.input ?? {})
    await svc.updateExecutionStatus(execution.id, "running")

    // Fetch user credentials from nexus_credentials table (if available)
    const { data: credRows } = await supabase
      .from("nexus_credentials")
      .select("provider, value")
      .eq("user_id", user.id)
    const credentials: Record<string, string> = {}
    for (const row of credRows ?? []) {
      credentials[row.provider] = row.value
    }

    // Run the real execution engine
    const result = await executeWorkflow(
      workflow.definition,
      { id: workflow.id, name: workflow.name },
      body.input ?? {},
      undefined, // no SSE progress in this route — use polling
      credentials,
    )

    // Map result to the shape stored in nexus_workflow_executions
    const nodeResults = result.node_results.map(r => ({
      node_id: r.node_id,
      node_type_id: r.node_type_id,
      status: r.status === "success" ? "completed" : r.status,
      input: r.input,
      output: r.output,
      error: r.error,
      duration_ms: r.duration_ms,
    }))

    const outputData = {
      summary: `Executed ${nodeResults.length} nodes in ${result.duration_ms}ms`,
      status: result.status,
      output: result.output,
    }

    const finalStatus = result.status === "completed" ? "completed" : "failed"

    // Save execution with all fields: output_data, node_results, duration_ms, completed_at
    const { data: completedExec, error: updateErr } = await supabase
      .from("nexus_workflow_executions")
      .update({
        status: finalStatus,
        output_data: outputData,
        node_results: nodeResults,
        duration_ms: result.duration_ms,
        completed_at: new Date().toISOString(),
        error_message: result.error ?? null,
      })
      .eq("id", execution.id)
      .eq("user_id", user.id)
      .select()
      .single()
    if (updateErr) console.error("Failed to update execution", updateErr)
    const completed = completedExec ?? execution

    // Update workflow: last_execution_at + increment execution_count
    await supabase
      .from("nexus_workflows")
      .update({
        last_execution_at: new Date().toISOString(),
        execution_count: (workflow.execution_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    return NextResponse.json({ execution: completed, result })
  } catch (e) {
    console.error("nexus/workflows/[id]/execute POST", e)
    return NextResponse.json({ error: "Execution failed", details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
