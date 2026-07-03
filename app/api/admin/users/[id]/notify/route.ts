import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["SYSTEM", "MODERATION", "BILLING", "MARKETPLACE"]).default("SYSTEM"),
  action_url: z.string().max(500).optional(),
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
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from("notifications").insert({
    user_id: id,
    title: parsed.data.title,
    message: parsed.data.message,
    type: parsed.data.type,
    action_url: parsed.data.action_url,
    priority: "NORMAL",
    read: false,
  })

  if (error) {
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }

  await service.from("audit_logs").insert({
    user_id: auth.user.id,
    action: "admin.user.notify",
    entity_type: "user",
    entity_id: id,
    metadata: { title: parsed.data.title, type: parsed.data.type },
  })

  return NextResponse.json({ success: true })
}
