import { createClient } from "@/lib/supabase/server"
import type { AnalyticsEvent, EventProperties } from "@/lib/analytics"
import { updateUserProfileFromEvent } from "@/lib/recommendations/profile"

export async function trackServerEvent(
  event: AnalyticsEvent,
  properties: EventProperties & { listing_id?: string }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("analytics_events").insert({
      event,
      user_id: user?.id ?? null,
      properties: properties as Record<string, unknown>,
    })
    void updateUserProfileFromEvent(user?.id, event, properties)
  } catch {
    // best-effort server-side event log
  }
}
