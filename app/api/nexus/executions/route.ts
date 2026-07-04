import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get("workflow_id") ?? undefined
    const svc = createNexusService(supabase, user.id)
    const executions = await svc.listExecutions(workflowId)
    return NextResponse.json({ executions })
  } catch (e) {
    console.error("nexus/executions GET", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
