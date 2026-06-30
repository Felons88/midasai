"use client"

import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Sparkles,
  Layers,
  History,
  SlidersHorizontal,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react"
import {
  MarketplaceCard,
  MarketplaceCardData,
  MarketplaceEmptyState,
} from "@/components/marketplace/MarketplaceCard"
import { SearchAutocomplete } from "@/components/marketplace/SearchAutocomplete"
import { cn } from "@/lib/utils"

export type SectionData = {
  id: string
  title: string
  icon: string
  listings: MarketplaceCardData[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Clock,
  Star,
  Zap,
  Sparkles,
  Layers,
  History,
}

type ExploreContentClientProps = {
  categories: { id: string; name: string; slug: string }[]
  selectedCategories: string[]
  sort: string
  sections: SectionData[]
  featuredCollections: { id: string; name: string; slug: string; description?: string | null }[]
  trendingSearches: string[]
}

const SORT_OPTIONS = [
  { value: "trending",   label: "Trending" },
  { value: "downloads",  label: "Most Downloaded" },
  { value: "newest",     label: "Newest" },
  { value: "rating",     label: "Top Rated" },
  { value: "updated",    label: "Recently Updated" },
]

const EXPLORE_CATEGORY_ORDER = [
  "ai-agents", "coding", "productivity", "automation", "research",
  "marketing", "security", "web-scraping", "databases", "devops",
  "image-generation", "video-creation", "voice", "education", "finance",
  "design", "writing", "browser-automation", "api", "mcp", "cloud",
]

const SECTION_SORT_MAP: Record<string, string> = {
  "for-you":  "recommended",
  "top":      "recommended",
  "popular":  "downloads",
  "new":      "newest",
  "featured": "downloads",
  "rated":    "rating",
  "updated":  "updated",
}

export function ExploreContentClient({
  categories,
  selectedCategories,
  sort,
  sections,
  featuredCollections,
  trendingSearches,
}: ExploreContentClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key)
      else params.set(key, value)
    })
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const toggleCategory = (slug: string) => {
    const current = new Set(selectedCategories)
    if (current.has(slug)) current.delete(slug)
    else current.add(slug)
    updateParams({ category: Array.from(current).join(",") || null })
  }

  const clearCategories = () => updateParams({ category: null })

  const sortedCategories = [...categories].sort((a, b) => {
    const ai = EXPLORE_CATEGORY_ORDER.indexOf(a.slug)
    const bi = EXPLORE_CATEGORY_ORDER.indexOf(b.slug)
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const hasResults = sections.some((s) => s.listings.length > 0)

  return (
    <div className="space-y-5">

      {/* ── Search bar ── */}
      <SearchAutocomplete onSearch={(q) => updateParams({ q })} />

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-[56px] z-20 -mx-4 px-4 py-2 bg-background/90 backdrop-blur-md border-b border-white/[0.05]">
        {/* Category pills — single scrollable row, no wrap */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={clearCategories}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              selectedCategories.length === 0
                ? "bg-cta border-cta text-white"
                : "bg-transparent border-white/10 text-text-tertiary hover:text-text-primary hover:border-white/20"
            )}
          >
            All
          </button>
          {sortedCategories.map((cat) => {
            const active = selectedCategories.includes(cat.slug)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.slug)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                  active
                    ? "bg-cta border-cta text-white"
                    : "bg-transparent border-white/10 text-text-tertiary hover:text-text-primary hover:border-white/20"
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Sort + trending + collections — compact row */}
        <div className="flex items-center justify-between gap-3 mt-1.5 min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide min-w-0">
            {trendingSearches.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onClick={() => updateParams({ q: s })}
                className="shrink-0 text-[11px] text-text-tertiary hover:text-cta transition-colors whitespace-nowrap"
              >
                #{s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="h-3 w-3 text-text-tertiary" />
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="bg-transparent border-none text-xs text-text-tertiary focus:outline-none cursor-pointer hover:text-text-primary transition-colors"
              aria-label="Sort listings"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── View All button ── */}
      <div className="flex justify-center pt-1">
        <Link
          href="/search?sort=downloads"
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-text-secondary hover:bg-cta/10 hover:border-cta/40 hover:text-cta transition-all duration-200"
        >
          <LayoutGrid className="h-4 w-4" />
          View all skills
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Content ── */}
      {!hasResults ? (
        <MarketplaceEmptyState
          title="No listings found"
          description="Try clearing category filters or check back soon."
        />
      ) : (
        <div className="space-y-8">
          {sections.map((section, si) => {
            const Icon = ICON_MAP[section.icon]
            const seeAllHref = section.id.startsWith("cat-")
              ? `/search?category=${section.id.replace("cat-", "")}&sort=downloads`
              : `/search?sort=${SECTION_SORT_MAP[section.id] ?? "downloads"}`

            return (
              <section key={section.id} className="animate-fade-in-up" style={{ animationDelay: `${si * 0.04}s` }}>
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {Icon && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-cta/10">
                        <Icon className="h-3.5 w-3.5 text-cta" />
                      </div>
                    )}
                    <h2 className="text-sm font-semibold text-text-primary">{section.title}</h2>
                    <span className="text-[10px] font-medium text-text-tertiary bg-white/5 rounded-full px-1.5 py-0.5 tabular-nums">
                      {section.listings.length}
                    </span>
                  </div>
                  <Link
                    href={seeAllHref}
                    className="text-[11px] text-text-tertiary hover:text-cta flex items-center gap-0.5 transition-colors"
                  >
                    See all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {section.listings.map((listing, idx) => (
                    <MarketplaceCard key={listing.id} listing={listing} index={idx} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* ── Bottom CTA ── */}
      {hasResults && (
        <div className="flex flex-col items-center gap-3 pt-4 pb-2">
          <p className="text-xs text-text-tertiary">Showing curated sections — browse everything below</p>
          <Link
            href="/search?sort=downloads"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cta/10 border border-cta/30 text-sm font-semibold text-cta hover:bg-cta hover:text-white hover:border-cta transition-all duration-200"
          >
            <LayoutGrid className="h-4 w-4" />
            View all skills
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  )
}
