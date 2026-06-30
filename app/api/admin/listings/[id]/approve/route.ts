import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: listingId } = await params
  const service = createServiceClient()

  const { data: listing, error: fetchError } = await service
    .from("listings")
    .select("id, title, creator_id, status")
    .eq("id", listingId)
    .maybeSingle()

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  const { error } = await service
    .from("listings")
    .update({ status: "ACTIVE", updated_at: new Date().toISOString() })
    .eq("id", listingId)

  if (error) {
    return NextResponse.json({ error: "Approve failed" }, { status: 500 })
  }

  if (listing.creator_id) {
    await service.from("notifications").insert({
      user_id: listing.creator_id,
      title: "Listing approved",
      message: `"${listing.title}" is now live on the marketplace.`,
      type: "MODERATION",
      read: false,
      priority: "normal",
      action_url: `/listing/${listingId}`,
      action_label: "View listing",
    })
  }

  await service.from("audit_logs").insert({
    user_id: auth.user.id,
    action: "admin.listing.approve",
    entity_type: "listing",
    entity_id: listingId,
  })

  return NextResponse.json({ success: true })
}
