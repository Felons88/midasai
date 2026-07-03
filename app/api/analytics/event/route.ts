import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsEvent, EventProperties } from "@/lib/analytics"
import { updateUserProfileFromEvent } from "@/lib/recommendations/profile"
import { z } from "zod"

const eventSchema = z.object({
  event: z.string(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()])).optional(),
  timestamp: z.string().datetime().optional(),
})

export async function POST(request: Request) {
  const { data, error: bodyError } = eventSchema.safeParse(await request.json())
  if (bodyError) {
    return NextResponse.json({ error: "Invalid event body" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error: insertError } = await supabase.from("analytics_events").insert({
    event: data.event,
    user_id: user?.id ?? null,
    properties: (data.properties ?? {}) as Record<string, unknown>,
    created_at: data.timestamp ?? new Date().toISOString(),
  })

  if (insertError) {
    console.error("analytics event insert error:", insertError)
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 })
  }

  void updateUserProfileFromEvent(user?.id, data.event as AnalyticsEvent, data.properties ?? {})

  return NextResponse.json({ success: true })
}
