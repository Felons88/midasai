import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workflowId = searchParams.get("workflow_id")

  let query = supabase
    .from("nexus_workflow_schedules")
    .select("*, nexus_workflows(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (workflowId) query = query.eq("workflow_id", workflowId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedules: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { workflow_id, cron_expr, timezone = "UTC", enabled = true } = body

  if (!workflow_id || !cron_expr) {
    return NextResponse.json({ error: "workflow_id and cron_expr are required" }, { status: 400 })
  }

  // Verify workflow belongs to user
  const { data: wf } = await supabase
    .from("nexus_workflows")
    .select("id")
    .eq("id", workflow_id)
    .eq("user_id", user.id)
    .single()
  if (!wf) return NextResponse.json({ error: "Workflow not found" }, { status: 404 })

  const { data, error } = await supabase
    .from("nexus_workflow_schedules")
    .insert({ workflow_id, user_id: user.id, cron_expr, timezone, enabled })
    .select("*, nexus_workflows(name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data }, { status: 201 })
}
