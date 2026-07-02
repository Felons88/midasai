import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { queueCategorization, runCategorizationJob } from "@/lib/categorization/service"

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: role } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  return role?.role === "ADMIN" || role?.role === "OWNER" || role?.role === "MODERATOR"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const service = createServiceClient()
  const { job, error } = await queueCategorization(service, id, 10)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  if (!job) {
    return NextResponse.json({ error: "Job already queued or listing not found" }, { status: 400 })
  }

  const result = await runCategorizationJob(service, job.id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, jobId: job.id })
}
