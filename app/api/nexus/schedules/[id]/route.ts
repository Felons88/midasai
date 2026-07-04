import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (body.cron_expr !== undefined) updates.cron_expr = body.cron_expr
  if (body.timezone !== undefined) updates.timezone = body.timezone
  if (body.enabled !== undefined) updates.enabled = body.enabled

  const { data, error } = await supabase
    .from("nexus_workflow_schedules")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*, nexus_workflows(name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("nexus_workflow_schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
