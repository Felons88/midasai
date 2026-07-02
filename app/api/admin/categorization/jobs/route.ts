import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

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

export async function GET(request: Request) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? undefined
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100)

  const service = createServiceClient()
  let query = service
    .from("categorization_jobs")
    .select("id, listing_id, status, completed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: data ?? [] })
}
