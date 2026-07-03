import { createServiceClient } from "@/lib/supabase/server"
import { applyRecencyDecay } from "@/lib/recommendations/profile"

export type RecommendationListing = {
  id: string
  title: string
  type: string
  price: number
  category_id: string | null
  tags: string[] | null
  creator_id: string
  language: string | null
  downloads: number
  average_rating: number
  review_count: number
  score: number
}

export async function getRecommendationsForUser(
  userId: string | null,
  limit = 10
): Promise<RecommendationListing[]> {
  const supabase = createServiceClient()

  if (!userId) {
    const { data } = await supabase
      .from("listings")
      .select("id, title, type, price, category_id, tags, creator_id, language, downloads, average_rating, review_count")
      .eq("status", "ACTIVE")
      .order("downloads", { ascending: false, nullsFirst: false })
      .limit(limit)

    return (data ?? []).map((item) => ({ ...item, score: 0 })) as RecommendationListing[]
  }

  const { data: profile } = await supabase
    .from("user_interest_profile")
    .select("dimension, value, weight, last_event_at")
    .eq("user_id", userId)
    .order("weight", { ascending: false })
    .limit(50)

  const rows = profile ?? []
  if (rows.length === 0) {
    const { data } = await supabase
      .from("listings")
      .select("id, title, type, price, category_id, tags, creator_id, language, downloads, average_rating, review_count")
      .eq("status", "ACTIVE")
      .order("downloads", { ascending: false, nullsFirst: false })
      .limit(limit)

    return (data ?? []).map((item) => ({ ...item, score: 0 })) as RecommendationListing[]
  }

  const weights: Record<string, Record<string, number>> = {
    category: {},
    tag: {},
    type: {},
    creator: {},
    language: {},
  }

  for (const row of rows) {
    const decayed = applyRecencyDecay(Number(row.weight), row.last_event_at)
    weights[row.dimension][row.value] = decayed
  }

  const topCategories = Object.keys(weights.category)
  const topTypes = Object.keys(weights.type)
  const topTags = Object.keys(weights.tag)
  const topCreators = Object.keys(weights.creator)
  const topLanguages = Object.keys(weights.language)

  let query = supabase
    .from("listings")
    .select("id, title, type, price, category_id, tags, creator_id, language, downloads, average_rating, review_count")
    .eq("status", "ACTIVE")

  if (topCategories.length > 0) {
    query = query.in("category_id", topCategories)
  } else if (topTypes.length > 0) {
    query = query.in("type", topTypes)
  } else if (topCreators.length > 0) {
    query = query.in("creator_id", topCreators)
  } else {
    query = query.order("downloads", { ascending: false, nullsFirst: false }).limit(limit)
    const { data } = await query
    return (data ?? []).map((item) => ({ ...item, score: 0 })) as RecommendationListing[]
  }

  const { data: candidates } = await query.limit(200)
  if (!candidates) return []

  const scored = candidates.map((item) => {
    let score = 0

    if (item.category_id && weights.category[item.category_id]) {
      score += weights.category[item.category_id]
    }

    if (item.type && weights.type[item.type]) {
      score += weights.type[item.type]
    }

    if (item.creator_id && weights.creator[item.creator_id]) {
      score += weights.creator[item.creator_id]
    }

    if (item.language && weights.language[item.language]) {
      score += weights.language[item.language]
    }

    if (Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        const normalized = String(tag).toLowerCase()
        if (weights.tag[normalized]) {
          score += weights.tag[normalized]
        }
      }
    }

    const popularityBoost = Math.log10((item.downloads ?? 0) + 1) * 0.5
    const ratingBoost = (Number(item.average_rating) || 0) * 0.2
    const reviewBoost = Math.log10((item.review_count ?? 0) + 1) * 0.2

    score += popularityBoost + ratingBoost + reviewBoost

    return { ...item, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit) as RecommendationListing[]
}
