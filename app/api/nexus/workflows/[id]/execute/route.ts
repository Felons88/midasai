import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

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

    // Create execution record
    const execution = await svc.createExecution(id, body.input ?? {})

    // Update to running
    await svc.updateExecutionStatus(execution.id, "running")

    // Simulate node execution (in production this calls the real execution engine)
    const nodeResults = workflow.definition.nodes.map((node) => ({
      node_id: node.id,
      node_type_id: node.node_type_id,
      status: "completed" as const,
      input: node.configuration,
      output: { result: `Node ${node.label ?? node.id} executed` },
      duration_ms: Math.floor(Math.random() * 500) + 50,
    }))

    const output = { node_results: nodeResults, summary: `Executed ${nodeResults.length} nodes` }
    const completed = await svc.updateExecutionStatus(execution.id, "completed", output)

    // Update last execution timestamp on workflow
    await svc.updateWorkflow(id, {
      last_execution_at: new Date().toISOString(),
    })

    return NextResponse.json({ execution: completed })
  } catch (e) {
    console.error("nexus/workflows/[id]/execute POST", e)
    return NextResponse.json({ error: "Execution failed" }, { status: 500 })
  }
}
