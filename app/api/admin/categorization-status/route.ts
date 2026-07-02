import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCategorizationStatus } from "@/lib/categorization/service"

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

export async function GET() {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = createServiceClient()
  const status = await getCategorizationStatus(service)

  if (status.error) {
    return NextResponse.json({ error: status.error }, { status: 500 })
  }

  return NextResponse.json(status)
}
