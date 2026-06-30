type AnalyticsEvent =
  | "listing_viewed"
  | "listing_purchased"
  | "listing_downloaded"
  | "listing_github_opened"
  | "review_submitted"
  | "listing_bookmarked"
  | "collection_created"
  | "contact_submitted"
  | "creator_followed"
  | "search_performed"

type EventProperties = Record<string, string | number | boolean | null | undefined>

export type { AnalyticsEvent, EventProperties }

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  if (typeof window === "undefined") return

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, properties)
  }
}

export function identifyUser(userId: string, properties?: EventProperties) {
  if (typeof window === "undefined") return
  // noop — PostHog removed
}
