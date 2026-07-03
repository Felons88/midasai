import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  if (id === auth.user.id) {
    return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from("users")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  await service.from("audit_logs").insert({
    user_id: auth.user.id,
    action: parsed.data.status === "SUSPENDED" ? "admin.user.suspend" : "admin.user.activate",
    entity_type: "user",
    entity_id: id,
    metadata: { previous_status: parsed.data.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" },
  })

  return NextResponse.json({ success: true, status: parsed.data.status })
}
