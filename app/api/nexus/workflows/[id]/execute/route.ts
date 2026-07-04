import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"
import { executeWorkflow } from "@/lib/nexus/executor"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const svc = createNexusService(supabase, user.id)

    // Verify workflow exists and belongs to user
    const workflow = await svc.getWorkflow(id)

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

    const output = {
      node_results: nodeResults,
      summary: `Executed ${nodeResults.length} nodes in ${result.duration_ms}ms`,
      status: result.status,
    }

    const finalStatus = result.status === "completed" ? "completed" : "failed"
    const completed = await svc.updateExecutionStatus(execution.id, finalStatus, output)

    // Update last execution timestamp
    await svc.updateWorkflow(id, { last_execution_at: new Date().toISOString() })

    return NextResponse.json({ execution: completed, result })
  } catch (e) {
    console.error("nexus/workflows/[id]/execute POST", e)
    return NextResponse.json({ error: "Execution failed", details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
