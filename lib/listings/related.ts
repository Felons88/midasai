import type { SupabaseClient } from "@supabase/supabase-js"

export async function fetchRelatedListings(
  supabase: SupabaseClient,
  listingId: string,
  options: {
    categoryId?: string | null
    type?: string
    creatorId?: string
    limit?: number
  }
) {
  const limit = options.limit ?? 4

  let query = supabase
    .from("listings")
    .select("id, title, seo_title, description, short_description, price, type, images, downloads, average_rating")
    .eq("status", "ACTIVE")
    .neq("id", listingId)
    .order("downloads", { ascending: false })
    .limit(limit)

  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId)
  } else if (options.type) {
    query = query.eq("type", options.type)
  }

  const { data, error } = await query

  if (error) {
    console.error("Related listings error:", error)
    return []
  }

  return data ?? []
}
