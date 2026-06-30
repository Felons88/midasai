import { createPublicClient } from "@/lib/supabase/server"
import { truncateText } from "@/lib/listings/normalize"
import type { MarketplacePageSize } from "@/lib/marketplace/pagination"

export type MarketplaceListingRow = {
  id: string
  title: string
  seo_title: string | null
  description: string
  short_description: string | null
  price: number
  type: string
  images: string[] | null
  downloads: number | null
  average_rating: number | null
  slug: string | null
}

export async function fetchPaginatedListings(options: {
  type: string
  page?: number
  limit?: MarketplacePageSize
}) {
  const page = options.page ?? 1
  const limit = options.limit ?? 50
  const offset = (page - 1) * limit
  const supabase = createPublicClient()

  const { data, error, count } = await supabase
    .from("listings")
    .select("id, title, seo_title, description, short_description, price, type, images, downloads, average_rating, slug", {
      count: "exact",
    })
    .eq("type", options.type)
    .eq("status", "ACTIVE")
    .order("downloads", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error(`Error fetching ${options.type} listings:`, error)
    return { listings: [] as MarketplaceListingRow[], total: 0, page, limit }
  }

  const listings = (data ?? []).map((row) => ({
    ...row,
    description: truncateText((row.short_description || row.description) ?? ""),
  }))

  return {
    listings,
    total: count ?? 0,
    page,
    limit,
  }
}
