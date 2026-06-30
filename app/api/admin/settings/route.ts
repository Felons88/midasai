import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  site_name: z.string().min(1).max(120),
  site_description: z.string().max(500).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  platform_fee: z.number().min(0).max(100),
  minimum_payout: z.number().min(0),
  maintenance_mode: z.boolean(),
})

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: existing } = await service.from("site_settings").select("id").limit(1).maybeSingle()

  const payload = {
    site_name: parsed.data.site_name,
    site_description: parsed.data.site_description ?? null,
    contact_email: parsed.data.contact_email || null,
    platform_fee: parsed.data.platform_fee,
    minimum_payout: parsed.data.minimum_payout,
    maintenance_mode: parsed.data.maintenance_mode,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing
    ? await service.from("site_settings").update(payload).eq("id", existing.id)
    : await service.from("site_settings").insert(payload)

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 })
  }

  await service.from("audit_logs").insert({
    user_id: auth.user.id,
    action: "admin.settings.update",
    entity_type: "site_settings",
    metadata: payload,
  })

  return NextResponse.json({ success: true })
}
