import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  role: z.enum(["USER", "CREATOR", "MODERATOR", "ADMIN", "OWNER"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  if (id === auth.user.id && parsed.data.role !== auth.role) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from("users")
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  await service.from("audit_logs").insert({
    user_id: auth.user.id,
    action: "admin.user.role_update",
    entity_type: "user",
    entity_id: id,
    metadata: { role: parsed.data.role },
  })

  return NextResponse.json({ success: true })
}
