type AnalyticsEvent =
  | "listing_viewed"
  | "listing_clicked"
  | "listing_purchased"
  | "listing_downloaded"
  | "listing_github_opened"
  | "review_submitted"
  | "listing_bookmarked"
  | "listing_unbookmarked"
  | "collection_created"
  | "contact_submitted"
  | "creator_followed"
  | "creator_unfollowed"
  | "search_performed"
  | "category_clicked"
  | "tag_clicked"
  | "architect_prompt_sent"
  | "architect_workshop_created"
  | "recommendation_served"
  | "recommendation_clicked"

type EventProperties = Record<string, string | number | boolean | null | undefined>

export type { AnalyticsEvent, EventProperties }

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  if (typeof window === "undefined") return

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, properties)
  }

  const payload = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Best-effort analytics; never block the UI.
  })
}

export function identifyUser(userId: string, properties?: EventProperties) {
  if (typeof window === "undefined") return
  // noop — PostHog removed
}
