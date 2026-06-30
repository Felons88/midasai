import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({ reason: z.string().max(500).optional() })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: listingId } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const reason = parsed.success ? parsed.data.reason : undefined

  const service = createServiceClient()
  const { data: listing, error: fetchError } = await service
    .from("listings")
    .select("id, title, creator_id")
    .eq("id", listingId)
    .maybeSingle()

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  const { error } = await service
    .from("listings")
    .update({ status: "REJECTED", updated_at: new Date().toISOString() })
    .eq("id", listingId)

  if (error) {
    return NextResponse.json({ error: "Reject failed" }, { status: 500 })
  }

  if (listing.creator_id) {
    await service.from("notifications").insert({
      user_id: listing.creator_id,
      title: "Listing rejected",
      message: `"${listing.title}" was not approved.${reason ? ` Reason: ${reason}` : ""}`,
      type: "MODERATION",
      read: false,
      priority: "normal",
    })
  }

  await service.from("audit_logs").insert({
    user_id: auth.user.id,
    action: "admin.listing.reject",
    entity_type: "listing",
    entity_id: listingId,
    metadata: { reason },
  })

  return NextResponse.json({ success: true })
}
