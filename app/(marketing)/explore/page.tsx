import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import {
  Compass,
} from "lucide-react"
import { Suspense } from "react"
import {
  MarketplaceCardData,
  MarketplaceCardGridSkeleton,
} from "@/components/marketplace/MarketplaceCard"
import type { SectionData } from "./ExploreContent"
import { ExploreContentClient } from "./ExploreContent"

export const metadata: Metadata = {
  title: "Explore AI Tools | MidasAI",
  description: "Discover trending skills, workflows, templates and plugins for Claude, Cursor, Windsurf and more.",
}

type ExplorePageProps = {
  searchParams?: Promise<{
    q?: string | string[]
    category?: string | string[]
    sort?: string | string[]
  }>
}

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const rawParams = searchParams ? await searchParams : undefined
  const q = normalizeParam(rawParams?.q)
  const category = normalizeParam(rawParams?.category)
  const sort = normalizeParam(rawParams?.sort)

  if (q) {
    redirect(`/search?q=${encodeURIComponent(q)}${category ? `&category=${encodeURIComponent(category)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`)
  }

  return (
    <div className="flex flex-col bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 pt-6 pb-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-5 animate-fade-in-up">
            <Compass className="h-5 w-5 text-cta shrink-0" />
            <h1 className="text-2xl font-bold text-text-primary">Explore</h1>
            <span className="text-text-tertiary text-sm hidden sm:block">— AI skills, agents, workflows &amp; templates</span>
          </div>

          <Suspense fallback={<ExploreSkeleton />}>
            <ExploreContent params={{ category, sort }} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ExploreSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 bg-surface rounded-xl animate-pulse" />
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-surface rounded-full animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s} className="space-y-4">
          <div className="h-5 bg-surface rounded w-40 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MarketplaceCardGridSkeleton key={i} count={1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

async function ExploreContent({ params }: { params?: { q?: string; category?: string; sort?: string } }) {
  try {
    const supabase = await createClient()
    let userId: string | undefined
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id
    } catch (authError) {
      console.error("Explore auth error:", authError)
      userId = undefined
    }

    const selectedCategory = params?.category
    const sort = params?.sort || "trending"

    let categories: { id: string; name: string; slug: string }[] = []
    let featuredCollections: { id: string; name: string; slug: string; description: string | null }[] = []
    try {
      const [categoriesResult, featuredResult] = await Promise.all([
        supabase.from("categories").select("id, name, slug").order("name"),
        supabase.from("collections").select("id, name, slug, description").eq("featured", true).eq("is_active", true).order("sort_order").limit(6),
      ])
      categories = (categoriesResult.data ?? []) as { id: string; name: string; slug: string }[]
      featuredCollections = (featuredResult.data ?? []) as { id: string; name: string; slug: string; description: string | null }[]
    } catch (dataError) {
      console.error("Explore categories/collections error:", dataError)
    }

    const sections = await buildDiscoverySections(supabase, userId, selectedCategory)
    const selectedCategories = selectedCategory ? selectedCategory.split(",") : []
    const trendingSearches = ["Claude Memory", "OpenClaw", "Browser Automation", "AI Agents", "Workflow Templates", "Cursor Rules"]

    return (
      <ExploreContentClient
        categories={categories}
        selectedCategories={selectedCategories}
        sort={sort}
        sections={sections}
        featuredCollections={featuredCollections}
        trendingSearches={trendingSearches}
      />
    )
  } catch (error) {
    console.error("Explore content error:", error)
    return (
      <ExploreContentClient
        categories={[]}
        selectedCategories={[]}
        sort={params?.sort || "trending"}
        sections={[]}
        featuredCollections={[]}
        trendingSearches={[]}
      />
    )
  }
}

async function buildDiscoverySections(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId?: string,
  selectedCategory?: string
): Promise<SectionData[]> {
  const baseSelect = `
    id, title, seo_title, description, short_description, type, price, downloads, views,
    average_rating, review_count, images, tags, updated_at, created_at, featured, quality_score,
    creator:users!listings_creator_id_fkey(id, name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified))
  `

  const categoryIds = await resolveCategoryIds(supabase, selectedCategory)
  const filtered = categoryIds.length > 0

  const base = () =>
    supabase.from("listings").select(baseSelect).eq("status", "ACTIVE")

  const withCat = (q: any) =>
    filtered ? q.in("category_id", categoryIds) : q

  const LIMIT = 12 // skills per section

  try {
    // Parallel fetch all sections + top categories
    const [
      topRated,
      mostDownloaded,
      newest,
      highRated,
      recentlyUpdated,
      featured,
      becauseYouViewed,
      topCategoriesResult,
    ] = await Promise.all([
      // 1. Top quality score — the best overall
      withCat(base())
        .order("quality_score", { ascending: false, nullsFirst: false })
        .order("downloads",     { ascending: false, nullsFirst: false })
        .limit(LIMIT),

      // 2. Most downloaded all-time
      withCat(base())
        .order("downloads", { ascending: false, nullsFirst: false })
        .order("quality_score", { ascending: false, nullsFirst: false })
        .limit(LIMIT),

      // 3. Newest additions
      withCat(base())
        .order("created_at", { ascending: false })
        .limit(LIMIT),

      // 4. Top rated (min 1 review)
      withCat(base())
        .gte("review_count", 1)
        .order("average_rating", { ascending: false, nullsFirst: false })
        .order("review_count",   { ascending: false, nullsFirst: false })
        .limit(LIMIT),

      // 5. Recently updated
      withCat(base())
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(LIMIT),

      // 6. Featured / editors pick
      withCat(base())
        .eq("featured", true)
        .order("quality_score", { ascending: false, nullsFirst: false })
        .limit(LIMIT),

      // 7. Personalised (if logged in)
      userId
        ? fetchRecommendations(supabase, "get_recommendations_because_you_downloaded", userId)
        : Promise.resolve({ data: [] }),

      // Top categories by listing count for dynamic sections
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .limit(20),
    ])

    // Deduplicate across sections — each skill appears only once
    const seen = new Set<string>()
    const dedup = (rows: any[]): MarketplaceCardData[] => {
      const result = normalizeRows(rows).filter((r) => !seen.has(r.id))
      result.forEach((r) => seen.add(r.id))
      return result
    }

    const sections: SectionData[] = []

    // Personalised first if available
    if (userId) {
      const because = dedup(becauseYouViewed?.data ?? [])
      if (because.length >= 3) {
        sections.push({ id: "for-you", title: "Picked For You", icon: "Sparkles", listings: because })
      }
    }

    const topRatedRows    = dedup(topRated.data ?? [])
    const downloadedRows  = dedup(mostDownloaded.data ?? [])
    const newestRows      = dedup(newest.data ?? [])
    const highRatedRows   = dedup(highRated.data ?? [])
    const updatedRows     = dedup(recentlyUpdated.data ?? [])
    const featuredRows    = dedup(featured.data ?? [])

    if (topRatedRows.length)   sections.push({ id: "top",      title: "Top Skills",        icon: "Sparkles",   listings: topRatedRows })
    if (downloadedRows.length) sections.push({ id: "popular",  title: "Most Popular",       icon: "TrendingUp", listings: downloadedRows })
    if (newestRows.length)     sections.push({ id: "new",      title: "Newly Added",        icon: "Clock",      listings: newestRows })
    if (featuredRows.length)   sections.push({ id: "featured", title: "Editor's Picks",     icon: "Star",       listings: featuredRows })
    if (highRatedRows.length)  sections.push({ id: "rated",    title: "Highest Rated",      icon: "Zap",        listings: highRatedRows })
    if (updatedRows.length)    sections.push({ id: "updated",  title: "Recently Updated",   icon: "History",    listings: updatedRows })

    // Dynamic top-category sections (skip if category already filtered)
    if (!filtered) {
      const CATEGORY_SECTIONS = [
        { slug: "ai-agents",    label: "AI Agents",    icon: "Zap" },
        { slug: "coding",       label: "Coding",       icon: "Layers" },
        { slug: "automation",   label: "Automation",   icon: "TrendingUp" },
        { slug: "productivity", label: "Productivity", icon: "Star" },
        { slug: "devops",       label: "DevOps",       icon: "Layers" },
        { slug: "security",     label: "Security",     icon: "Sparkles" },
        { slug: "research",     label: "Research",     icon: "Clock" },
        { slug: "writing",      label: "Writing",      icon: "History" },
      ]

      const allCategories = topCategoriesResult.data ?? []
      const catMap = new Map(allCategories.map((c: any) => [c.slug, c.id]))

      const catFetches = CATEGORY_SECTIONS
        .filter((cs) => catMap.has(cs.slug))
        .map(async (cs) => {
          const { data } = await base()
            .eq("category_id", catMap.get(cs.slug)!)
            .order("downloads", { ascending: false, nullsFirst: false })
            .order("quality_score", { ascending: false, nullsFirst: false })
            .limit(LIMIT)
          return { cs, rows: data ?? [] }
        })

      const catResults = await Promise.all(catFetches)
      for (const { cs, rows } of catResults) {
        const listings = dedup(rows)
        if (listings.length >= 3) {
          sections.push({ id: `cat-${cs.slug}`, title: `Popular in ${cs.label}`, icon: cs.icon, listings })
        }
      }
    }

    return sections.filter((s) => s.listings.length > 0)
  } catch (error) {
    console.error("Explore sections error:", error)
    return []
  }
}

async function resolveCategoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  selectedCategory?: string
) {
  if (!selectedCategory) return []

  const values = selectedCategory
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (values.length === 0) return []

  const { data } = await supabase
    .from("categories")
    .select("id, slug")

  const rows = data ?? []
  const bySlug = new Map(rows.map((row) => [row.slug, row.id]))
  const byId = new Set(rows.map((row) => row.id))

  return values
    .map((value) => bySlug.get(value) ?? (byId.has(value) ? value : null))
    .filter((value): value is string => Boolean(value))
}

async function fetchPopularByCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categorySlug: string
) {
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle()

  if (!category?.id) return []

  const { data } = await supabase
    .from("listings")
    .select(`
      id, title, seo_title, description, short_description, type, price, downloads, views, average_rating, review_count, images, tags, updated_at, created_at, featured,
      creator:users!listings_creator_id_fkey(id, name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified))
    `)
    .eq("status", "ACTIVE")
    .eq("category_id", category.id)
    .order("downloads", { ascending: false, nullsFirst: false })
    .limit(8)

  return data ?? []
}

async function buildSidebarData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [trendingResult, categoryResult, recentResult, featuredCreatorResult, statsResult] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, downloads")
      .eq("status", "ACTIVE")
      .order("downloads", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("categories")
      .select("id, name, slug, listings(count)")
      .eq("is_active", true)
      .limit(5),
    supabase
      .from("listings")
      .select("title, updated_at")
      .eq("status", "ACTIVE")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(4),
    supabase
      .from("creators")
      .select("user_id, verified, users!creators_user_id_fkey(name), listings(count)")
      .eq("verified", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("id, creator_id, downloads")
      .eq("status", "ACTIVE"),
  ])

  const statsRows = statsResult.data ?? []
  const creators = new Set(statsRows.map((row) => row.creator_id))

  return {
    trendingSkills: (trendingResult.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      downloads: item.downloads ?? 0,
    })),
    topCategories: (categoryResult.data ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      count: item.listings?.[0]?.count ?? 0,
    })),
    recentActivity: (recentResult.data ?? []).map((item) => ({
      title: item.title,
      action: "Updated",
      timeLabel: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "Recently",
    })),
    featuredCreator: featuredCreatorResult.data
      ? {
          id: featuredCreatorResult.data.user_id,
          name: (featuredCreatorResult.data as any).users?.name ?? "Verified Creator",
          slug: null,
          verified: featuredCreatorResult.data.verified ?? false,
          listingCount: (featuredCreatorResult.data as any).listings?.[0]?.count ?? 0,
        }
      : undefined,
    stats: {
      totalListings: statsRows.length,
      totalCreators: creators.size,
      totalDownloads: statsRows.reduce((sum, row) => sum + (row.downloads ?? 0), 0),
    },
  }
}

async function fetchRecommendations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rpc: "get_recommendations_because_you_downloaded",
  userId: string
) {
  try {
    const { data } = await supabase.rpc(rpc, { p_user_id: userId, p_limit: 8 })
    return { data: data ?? [] }
  } catch {
    return { data: [] }
  }
}

function normalizeRows(rows: any[] | null | undefined): MarketplaceCardData[] {
  return (rows ?? []).map((item) => {
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
  })
}
