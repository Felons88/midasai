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
  const threshold = Number(searchParams.get("threshold") ?? "50")
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100)

  const service = createServiceClient()
  const { data, error } = await service.rpc("get_low_confidence_categories", {
    p_threshold: threshold,
    p_limit: limit,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}
