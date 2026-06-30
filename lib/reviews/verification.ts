import type { ReviewVerificationType } from "@/components/marketplace/VerifiedReviewBadge"

export interface ReviewVerificationMaps {
  purchasers: string[]
  downloaders: string[]
}

export function resolveReviewVerification(
  userId: string,
  maps: ReviewVerificationMaps
): ReviewVerificationType | null {
  if (maps.purchasers.includes(userId)) return "purchase"
  if (maps.downloaders.includes(userId)) return "download"
  return null
}

export function buildReviewVerificationMaps(
  transactions: { user_id: string }[],
  downloads: { user_id: string | null }[]
): ReviewVerificationMaps {
  return {
    purchasers: [...new Set(transactions.map((t) => t.user_id))],
    downloaders: [
      ...new Set(
        downloads.map((d) => d.user_id).filter((id): id is string => Boolean(id))
      ),
    ],
  }
}

export const EMPTY_REVIEW_VERIFICATION_MAPS: ReviewVerificationMaps = {
  purchasers: [],
  downloaders: [],
}
