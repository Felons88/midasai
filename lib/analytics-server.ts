import { createServiceClient } from "@/lib/supabase/server"
import type { AnalyticsEvent, EventProperties } from "@/lib/analytics"

export async function trackServerEvent(
  event: AnalyticsEvent,
  properties: EventProperties & { listing_id?: string }
) {
  const listingId = properties.listing_id
  if (!listingId) return

  try {
    const service = createServiceClient()
    await service.from("analytics").insert({
      event_type: event,
      listing_id: listingId,
      metadata: properties,
    })
  } catch {
    // best-effort server-side event log
  }
}
