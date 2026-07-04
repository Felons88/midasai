import { createClient } from "@/lib/supabase/server"
import { createNexusService } from "@/lib/nexus/service"
import { executeWorkflow } from "@/lib/nexus/executor"
import type { ExecutionProgress } from "@/lib/nexus/executor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const url = new URL(request.url)
  const inputStr = url.searchParams.get("input") ?? "{}"
  let input: Record<string, unknown> = {}
  try { input = JSON.parse(inputStr) } catch { /* ignore */ }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const svc = createNexusService(supabase, user!.id)
        const workflow = await svc.getWorkflow(id)

        if (!workflow.definition?.nodes?.length) {
          send("error", { message: "Workflow has no nodes" })
          controller.close()
          return
        }

        // Fetch credentials
        const { data: credRows } = await supabase
          .from("nexus_credentials")
          .select("provider, value")
          .eq("user_id", user!.id)
        const credentials: Record<string, string> = {}
        for (const row of credRows ?? []) credentials[row.provider] = row.value

        // Create execution record
        const execution = await svc.createExecution(id, input)
        await svc.updateExecutionStatus(execution.id, "running")

        send("start", { executionId: execution.id, nodeCount: workflow.definition.nodes.length })

        // Progress callback — fires for each node start/finish
        const onProgress = (p: ExecutionProgress) => {
          send("node", p)
        }

        const result = await executeWorkflow(
          workflow.definition,
          { id: workflow.id, name: workflow.name },
          input,
          onProgress,
          credentials,
        )

        // Persist result
        const nodeResults = result.node_results.map(r => ({
          node_id: r.node_id,
          node_type_id: r.node_type_id,
          status: r.status === "success" ? "completed" : r.status,
          input: r.input,
          output: r.output,
          error: r.error,
          duration_ms: r.duration_ms,
        }))

        await supabase.from("nexus_workflow_executions").update({
          status: result.status === "completed" ? "completed" : "failed",
          output_data: { summary: `${nodeResults.length} nodes in ${result.duration_ms}ms`, output: result.output },
          node_results: nodeResults,
          duration_ms: result.duration_ms,
          completed_at: new Date().toISOString(),
          error_message: result.error ?? null,
        }).eq("id", execution.id).eq("user_id", user!.id)

        await supabase.from("nexus_workflows").update({
          last_execution_at: new Date().toISOString(),
          execution_count: (workflow.execution_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq("id", id).eq("user_id", user!.id)

        send("complete", { status: result.status, duration_ms: result.duration_ms, output: result.output })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        send("error", { message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
