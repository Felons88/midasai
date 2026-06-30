import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]),
  action_taken: z.string().max(200).optional(),
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: report } = await service
    .from("moderation_reports")
    .select("id, listing_id")
    .eq("id", id)
    .maybeSingle()

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { error } = await service
    .from("moderation_reports")
    .update({
      status: parsed.data.status,
      action_taken: parsed.data.action_taken ?? null,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  if (parsed.data.action_taken === "listing_removed" && report.listing_id) {
    await service
      .from("listings")
      .update({ status: "REJECTED", updated_at: new Date().toISOString() })
      .eq("id", report.listing_id)
  }

  return NextResponse.json({ success: true })
}
