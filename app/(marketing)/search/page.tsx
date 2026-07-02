import { ArrowUpDown, LayoutGrid, SlidersHorizontal, X } from "lucide-react"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingGrid } from "@/components/ui/loading"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import {
  MarketplaceCardData,
  MarketplaceEmptyState,
} from "@/components/marketplace/MarketplaceCard"
import { SearchAutocomplete } from "@/components/marketplace/SearchAutocomplete"
import { SearchResults as SearchResultsComponent } from "@/components/marketplace/SearchResults"
import { applyListingSearch, applySearchRanking } from "@/lib/search/listings"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Search AI Tools | MidasAI",
  description: "Search skills, agents, workflows, templates, and automations for Claude, Cursor, Windsurf and more.",
}

export const revalidate = 30

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "rating", label: "Most Liked" },
  { value: "updated", label: "Recently Updated" },
]

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[]
    category?: string | string[]
    type?: string | string[]
    sort?: string | string[]
    minPrice?: string | string[]
    maxPrice?: string | string[]
    minRating?: string | string[]
  }>
}

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = searchParams ? await searchParams : undefined
  const resolvedParams = rawParams
    ? {
        q: normalizeParam(rawParams.q),
        category: normalizeParam(rawParams.category),
        type: normalizeParam(rawParams.type),
        sort: normalizeParam(rawParams.sort),
        minPrice: normalizeParam(rawParams.minPrice),
        maxPrice: normalizeParam(rawParams.maxPrice),
        minRating: normalizeParam(rawParams.minRating),
      }
    : undefined

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 pt-6 pb-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-5 animate-fade-in-up">
            <LayoutGrid className="h-5 w-5 text-cta shrink-0" />
            <h1 className="text-2xl font-bold text-text-primary">
              {resolvedParams?.q ? "Search Results" : "Search Skills"}
            </h1>
            <span className="text-text-tertiary text-sm hidden sm:block">— find AI skills, agents, workflows, and templates</span>
          </div>

          <Suspense fallback={<LoadingGrid count={8} />}>
            <SearchResults resolvedParams={resolvedParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function SearchResults({
  resolvedParams,
}: {
  resolvedParams?: {
    q?: string
    category?: string
    type?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    minRating?: string
  }
}) {
  try {
    const supabase = await createClient()

    const query = resolvedParams?.q || ""
    const selectedCategories = resolvedParams?.category ? resolvedParams.category.split(",") : []
    const selectedType = resolvedParams?.type
    const sort = resolvedParams?.sort || "recommended"
    const minPrice = resolvedParams?.minPrice ? parseFloat(resolvedParams.minPrice) : undefined
    const maxPrice = resolvedParams?.maxPrice ? parseFloat(resolvedParams.maxPrice) : undefined
    const minRating = resolvedParams?.minRating ? parseFloat(resolvedParams.minRating) : undefined

    const [categoriesResult, typeEnumsResult, rawListings, countResult] = await Promise.all([
      supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name"),
      fetchTypeEnums(supabase),
      fetchSearchResults(supabase, {
        query,
        categoryIds: selectedCategories,
        type: selectedType,
        sort,
        minPrice,
        maxPrice,
        minRating,
        limit: 20,
      }),
      fetchSearchCount(supabase, {
        query,
        categoryIds: selectedCategories,
        type: selectedType,
        minPrice,
        maxPrice,
        minRating,
      }),
    ])

    const categoryList = categoriesResult.data ?? []
    const typeList = (typeEnumsResult ?? []) as string[]
    const resultListings = (rawListings ?? []).map((item: any) => {
      const creator = item.creator
        ? {
            name: item.creator.name,
            avatar_url: item.creator.avatar_url,
            verified: item.creator.creator_profile?.verified ?? false,
          }
        : undefined
      return {
        id: item.id,
        title: item.title,
        seo_title: item.seo_title,
        description: item.description,
        short_description: item.short_description,
        type: item.type,
        price: item.price,
        downloads: item.downloads,
        views: item.views,
        average_rating: item.average_rating,
        review_count: item.review_count,
        images: item.images,
        tags: item.tags,
        updated_at: item.updated_at,
        creator,
        featured: item.featured,
        verified: creator?.verified,
      }
    }) as MarketplaceCardData[]

    const count = countResult ?? 0

  const buildHref = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (selectedCategories.length > 0) params.set("category", selectedCategories.join(","))
    if (selectedType) params.set("type", selectedType)
    if (sort) params.set("sort", sort)
    if (minPrice !== undefined) params.set("minPrice", String(minPrice))
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice))
    if (minRating !== undefined) params.set("minRating", String(minRating))

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const qs = params.toString()
    return `/search${qs ? `?${qs}` : ""}`
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <SearchAutocomplete initialQuery={query} />
        {query && (
          <p className="mt-3 text-sm text-text-tertiary">
            Results for <span className="text-text-primary font-medium">{query}</span>
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex flex-col gap-6">
          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-primary">Categories</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryList.map((category: { id: string; name: string; slug: string }) => {
                const selected = selectedCategories.includes(category.id)
                const next = selected
                  ? selectedCategories.filter((id) => id !== category.id)
                  : [...selectedCategories, category.id]
                return (
                  <a
                    key={category.id}
                    href={buildHref({ category: next.length > 0 ? next.join(",") : null })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta",
                      selected
                        ? "bg-cta text-primary-foreground border-cta"
                        : "bg-surface border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20"
                    )}
                  >
                    {category.name}
                  </a>
                )
              })}
            </div>
          </div>

          {/* Sort */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpDown className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-primary">Sort</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => {
                const selected = sort === opt.value
                return (
                  <a
                    key={opt.value}
                    href={buildHref({ sort: opt.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth border",
                      selected
                        ? "bg-cta text-primary-foreground border-cta"
                        : "bg-surface border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20"
                    )}
                  >
                    {opt.label}
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(selectedCategories.length > 0 || selectedType || minPrice !== undefined || maxPrice !== undefined || minRating !== undefined) && (
          <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-white/5">
            <span className="text-sm text-text-tertiary">Active filters:</span>
            {selectedCategories.map((id) => {
              const category = categoryList.find((c: { id: string; name: string; slug: string }) => c.id === id)
              return (
                <Badge key={id} variant="secondary" className="gap-1">
                  {category?.name ?? id}
                  <a href={buildHref({ category: selectedCategories.filter((c) => c !== id).join(",") || null })}>
                    <X className="h-3 w-3" />
                  </a>
                </Badge>
              )
            })}
            {selectedType && (
              <Badge variant="secondary" className="gap-1">
                {selectedType}
                <a href={buildHref({ type: null })}>
                  <X className="h-3 w-3" />
                </a>
              </Badge>
            )}
            <a href="/search" className="text-xs text-text-tertiary hover:text-text-primary underline ml-2">
              Clear all
            </a>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <SearchResultsComponent
          initialListings={resultListings}
          total={count || 0}
          query={query}
          category={selectedCategories.join(",")}
          sort={sort}
          type={selectedType}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minRating={minRating}
        />
      </div>
    </>
  )
  } catch (error) {
    console.error("Search results render error:", error)
    return (
      <>
        <div className="mb-8">
          <SearchAutocomplete initialQuery={resolvedParams?.q ?? ""} />
        </div>
        <MarketplaceEmptyState
          title="Search unavailable"
          description="We couldn't load search results right now. Please try again."
        />
      </>
    )
  }
}

async function fetchTypeEnums(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data } = await supabase.rpc("get_listing_type_enum_values")
    return data ?? []
  } catch {
    return []
  }
}

async function fetchSearchCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: {
    query: string
    categoryIds: string[]
    type?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
  }
): Promise<number> {
  try {
    let q = supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "ACTIVE")
    if (filters.categoryIds.length > 0) q = q.in("category_id", filters.categoryIds)
    if (filters.type) q = q.eq("type", filters.type)
    if (filters.minPrice !== undefined) q = q.gte("price", filters.minPrice)
    if (filters.maxPrice !== undefined) q = q.lte("price", filters.maxPrice)
    if (filters.minRating !== undefined) q = q.gte("average_rating", filters.minRating)
    if (filters.query) q = applyListingSearch(q as any, filters.query, "fuzzy") as any
    const { count } = await q
    return count ?? 0
  } catch {
    return 0
  }
}

async function fetchSearchResults(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: {
    query: string
    categoryIds: string[]
    type?: string
    sort: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    limit?: number
  }
) {
  const select = `
    id, title, seo_title, description, short_description, type, price, downloads, views, average_rating, review_count, images, tags, updated_at, featured,
    creator:users!listings_creator_id_fkey(id, name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified)),
    categories(name, slug)
  `

  let dbQuery = supabase.from("listings").select(select).eq("status", "ACTIVE")

  if (filters.categoryIds.length > 0) {
    dbQuery = dbQuery.in("category_id", filters.categoryIds)
  }

  if (filters.type) {
    dbQuery = dbQuery.eq("type", filters.type)
  }

  if (filters.minPrice !== undefined) {
    dbQuery = dbQuery.gte("price", filters.minPrice)
  }

  if (filters.maxPrice !== undefined) {
    dbQuery = dbQuery.lte("price", filters.maxPrice)
  }

  if (filters.minRating !== undefined) {
    dbQuery = dbQuery.gte("average_rating", filters.minRating)
  }

  if (filters.query) {
    dbQuery = applyListingSearch(dbQuery, filters.query, "fuzzy")
  }

  switch (filters.sort) {
    case "recommended":
      if (filters.query) {
        dbQuery = applySearchRanking(dbQuery, filters.query)
        dbQuery = dbQuery.order("search_rank", { ascending: false, nullsFirst: false })
      } else {
        dbQuery = dbQuery.order("average_rating", { ascending: false, nullsFirst: false })
      }
      break
    case "trending":
      dbQuery = dbQuery.order("views", { ascending: false, nullsFirst: false })
      break
    case "newest":
      dbQuery = dbQuery.order("created_at", { ascending: false })
      break
    case "downloads":
      dbQuery = dbQuery.order("downloads", { ascending: false, nullsFirst: false })
      break
    case "rating":
      dbQuery = dbQuery.order("average_rating", { ascending: false, nullsFirst: false })
      break
    case "updated":
      dbQuery = dbQuery.order("updated_at", { ascending: false, nullsFirst: false })
      break
    default:
      dbQuery = dbQuery.order("downloads", { ascending: false, nullsFirst: false })
  }

  const { data, error } = await dbQuery.limit(filters.limit ?? 48)

  if (error) {
    console.error("Search results error:", error)
    return []
  }

  return data
}
