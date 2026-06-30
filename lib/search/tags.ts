import type { SupabaseClient } from "@supabase/supabase-js"
import { slugifyTag } from "@/lib/listings/tags"

export async function resolveListingIdsForTag(
  supabase: SupabaseClient,
  tagSlug: string
): Promise<string[] | null> {
  const slug = tagSlug.trim().toLowerCase()
  if (!slug) return null

  const { data: tag } = await supabase
    .from("tags")
    .select("id, name")
    .or(`slug.eq.${slug},name.ilike.${slug}`)
    .maybeSingle()

  if (tag) {
    const { data: links } = await supabase
      .from("listing_tags")
      .select("listing_id")
      .eq("tag_id", tag.id)

    if (links && links.length > 0) {
      return links.map((l) => l.listing_id)
    }
  }

  return null
}

export async function fetchPopularTags(supabase: SupabaseClient, limit = 16) {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name", { ascending: true })
    .limit(limit)

  if (!error && data && data.length > 0) {
    return data
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("tags")
    .eq("status", "ACTIVE")
    .limit(200)

  const names = new Set<string>()
  for (const row of listings ?? []) {
    for (const tag of row.tags ?? []) {
      if (tag) names.add(tag)
    }
  }

  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit)
    .map((name) => ({ id: slugifyTag(name), name, slug: slugifyTag(name) }))
}

export function applyTagArrayFilter<T>(
  query: T,
  tagSlug: string
): T {
  const q = query as { contains: (column: string, value: string[]) => T }
  return q.contains("tags", [tagSlug])
}
