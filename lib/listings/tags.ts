import type { SupabaseClient } from "@supabase/supabase-js"

export function slugifyTag(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function syncListingTags(
  service: SupabaseClient,
  listingId: string,
  tagNames: string[]
) {
  const normalized = [
    ...new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
  ].slice(0, 20)

  await service
    .from("listings")
    .update({ tags: normalized })
    .eq("id", listingId)

  const tagIds: string[] = []

  for (const name of normalized) {
    const slug = slugifyTag(name)
    if (!slug) continue

    const { data: existing } = await service
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existing) {
      tagIds.push(existing.id)
      continue
    }

    const { data: created, error } = await service
      .from("tags")
      .insert({ name, slug })
      .select("id")
      .single()

    if (!error && created) {
      tagIds.push(created.id)
    }
  }

  await service.from("listing_tags").delete().eq("listing_id", listingId)

  if (tagIds.length > 0) {
    await service.from("listing_tags").insert(
      tagIds.map((tag_id) => ({ listing_id: listingId, tag_id }))
    )
  }

  return normalized
}

export async function fetchListingTagNames(
  supabase: SupabaseClient,
  listingId: string,
  fallbackTags?: string[] | null
): Promise<string[]> {
  const { data: links } = await supabase
    .from("listing_tags")
    .select("tags(name)")
    .eq("listing_id", listingId)

  const junctionNames =
    links
      ?.map((row) => {
        const tag = row.tags as { name?: string } | null
        return tag?.name
      })
      .filter((name): name is string => Boolean(name)) ?? []

  if (junctionNames.length > 0) {
    return [...new Set(junctionNames)]
  }

  return fallbackTags ?? []
}
