import { createServiceClient } from "@/lib/supabase/server"
import type { AnalyticsEvent, EventProperties } from "@/lib/analytics"

type ProfileDimension = {
  dimension: "category" | "tag" | "type" | "creator" | "language"
  value: string
  weight: number
}

const EVENT_BASE_WEIGHTS: Record<AnalyticsEvent, number> = {
  listing_viewed: 1,
  listing_clicked: 2,
  listing_purchased: 12,
  listing_downloaded: 8,
  listing_github_opened: 8,
  review_submitted: 3,
  listing_bookmarked: 5,
  listing_unbookmarked: -3,
  collection_created: 2,
  contact_submitted: 0,
  creator_followed: 6,
  creator_unfollowed: -4,
  search_performed: 3,
  category_clicked: 2,
  tag_clicked: 2,
  architect_prompt_sent: 5,
  architect_workshop_created: 4,
  recommendation_served: 0,
  recommendation_clicked: 4,
}

export async function getListingDimensions(listingId: string): Promise<ProfileDimension[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("listings")
    .select("category_id, tags, type, creator_id, language")
    .eq("id", listingId)
    .single()

  if (!data) return []

  const dims: ProfileDimension[] = []

  if (data.category_id) {
    dims.push({ dimension: "category", value: data.category_id, weight: 1 })
  }

  if (data.type) {
    dims.push({ dimension: "type", value: data.type, weight: 1 })
  }

  if (data.creator_id) {
    dims.push({ dimension: "creator", value: data.creator_id, weight: 1 })
  }

  if (data.language) {
    dims.push({ dimension: "language", value: data.language, weight: 0.5 })
  }

  if (Array.isArray(data.tags)) {
    for (const tag of data.tags) {
      if (typeof tag === "string" && tag.length > 0) {
        dims.push({ dimension: "tag", value: tag.toLowerCase(), weight: 0.5 })
      }
    }
  }

  return dims
}

async function getCategoryIdFromSlug(slug: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).single()
  return data?.id ?? null
}

async function extractPromptDimensions(prompt: string): Promise<ProfileDimension[]> {
  const dims: ProfileDimension[] = []
  const lower = prompt.toLowerCase()

  const supabase = createServiceClient()
  const { data: categories } = await supabase.from("categories").select("id, name, slug")
  if (categories) {
    for (const cat of categories) {
      const tokens = [cat.name?.toLowerCase(), cat.slug?.toLowerCase()].filter(Boolean) as string[]
      if (tokens.some((t) => lower.includes(t))) {
        dims.push({ dimension: "category", value: cat.id, weight: 0.8 })
      }
    }
  }

  const typeKeywords: Record<string, string> = {
    skill: "SKILL",
    agent: "AGENT",
    mcp: "MCP",
    plugin: "PLUGIN",
    workflow: "WORKFLOW",
    prompt: "PROMPT",
    template: "TEMPLATE",
    automation: "AUTOMATION",
  }

  for (const [keyword, type] of Object.entries(typeKeywords)) {
    if (lower.includes(keyword)) {
      dims.push({ dimension: "type", value: type, weight: 0.8 })
    }
  }

  return dims
}

async function extractDimensionsFromEvent(
  event: AnalyticsEvent,
  properties: EventProperties
): Promise<ProfileDimension[]> {
  const listingId = properties.listing_id as string | undefined

  if (listingId && event !== "recommendation_served") {
    return await getListingDimensions(listingId)
  }

  if (event === "category_clicked") {
    const slug = properties.category_slug as string | undefined
    if (slug) {
      const id = await getCategoryIdFromSlug(slug)
      if (id) {
        return [{ dimension: "category", value: id, weight: 1 }]
      }
    }
  }

  if (event === "search_performed") {
    const dims: ProfileDimension[] = []
    const categories = properties.categories as string | undefined
    const type = properties.type as string | undefined

    if (categories) {
      for (const id of categories.split(",")) {
        if (id) dims.push({ dimension: "category", value: id, weight: 0.9 })
      }
    }

    if (type) {
      dims.push({ dimension: "type", value: type, weight: 0.9 })
    }

    return dims
  }

  if (event === "tag_clicked") {
    const tag = properties.tag as string | undefined
    if (tag) {
      return [{ dimension: "tag", value: tag.toLowerCase(), weight: 1 }]
    }
  }

  if (event === "creator_followed" || event === "creator_unfollowed") {
    const creatorId = properties.creator_id as string | undefined
    if (creatorId) {
      return [{ dimension: "creator", value: creatorId, weight: 1 }]
    }
  }

  if (event === "architect_prompt_sent") {
    const prompt = properties.prompt as string | undefined
    if (prompt) {
      return await extractPromptDimensions(prompt)
    }
  }

  return []
}

export async function updateUserProfileFromEvent(
  userId: string | null | undefined,
  event: AnalyticsEvent,
  properties: EventProperties
) {
  if (!userId) return

  const baseWeight = EVENT_BASE_WEIGHTS[event] ?? 1
  if (baseWeight === 0) return

  const dimensions = await extractDimensionsFromEvent(event, properties)
  if (dimensions.length === 0) return

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  for (const dim of dimensions) {
    const delta = baseWeight * dim.weight

    const { data: existing } = await supabase
      .from("user_interest_profile")
      .select("id, weight, event_count")
      .eq("user_id", userId)
      .eq("dimension", dim.dimension)
      .eq("value", dim.value)
      .maybeSingle()

    if (existing) {
      await supabase
        .from("user_interest_profile")
        .update({
          weight: Number(existing.weight) + delta,
          event_count: existing.event_count + 1,
          last_event_at: now,
        })
        .eq("id", existing.id)
    } else {
      await supabase.from("user_interest_profile").insert({
        user_id: userId,
        dimension: dim.dimension,
        value: dim.value,
        weight: delta,
        event_count: 1,
        last_event_at: now,
      })
    }
  }
}

export async function getUserInterestProfile(userId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("user_interest_profile")
    .select("*")
    .eq("user_id", userId)
    .order("weight", { ascending: false })

  if (error) {
    console.error("getUserInterestProfile error:", error)
    return []
  }

  return data ?? []
}

export function applyRecencyDecay(weight: number, lastEventAt: string, halfLifeDays = 7): number {
  const days = (Date.now() - new Date(lastEventAt).getTime()) / (1000 * 60 * 60 * 24)
  return weight * Math.pow(0.5, days / halfLifeDays)
}
