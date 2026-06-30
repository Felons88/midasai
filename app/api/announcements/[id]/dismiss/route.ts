import { createClient } from "@/lib/supabase/server"
import { recordChangelogAcknowledgement } from "@/lib/announcements/changelog"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["confirmed", "dismissed", "learn_more"]).default("confirmed"),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: announcementId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const action = parsed.success ? parsed.data.action : "confirmed"

  const result = await recordChangelogAcknowledgement(user.id, announcementId, action)

  if (!result.ok) {
    return NextResponse.json({ error: "Failed to record acknowledgement" }, { status: 500 })
  }

  return NextResponse.json({ success: true, action })
}
