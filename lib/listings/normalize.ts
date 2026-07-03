export const LISTING_DESCRIPTION_PREVIEW_MAX = 250

export function truncateText(text: string, max = LISTING_DESCRIPTION_PREVIEW_MAX): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

export function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === "string" && t.length > 0)
  }
  return []
}

export function normalizeReviews(reviews: unknown) {
  if (!Array.isArray(reviews)) return []
  return reviews.map((review) => {
    const row = review as Record<string, unknown>
    const responses = row.review_responses
    const normalizedResponses = Array.isArray(responses)
      ? responses
      : responses && typeof responses === "object"
        ? [responses]
        : []
    return { ...row, review_responses: normalizedResponses } as any
  })
}

export function averageRatingFromReviews(
  reviews: Array<{ rating: number }>,
  fallback = 0
): number {
  if (!reviews.length) return fallback
  return reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
}
