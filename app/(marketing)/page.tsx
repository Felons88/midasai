import { createPublicClient } from "@/lib/supabase/server"
import type { MarketplaceCardData } from "@/components/marketplace/MarketplaceCard"
import type { CreatorItem } from "@/components/homepage/CreatorCard"
import { HeroSection } from "@/components/homepage/HeroSection"
import { StatsSection } from "@/components/homepage/StatsSection"
import { CategoriesSection } from "@/components/homepage/CategoriesSection"
import { FeaturesSection } from "@/components/homepage/FeaturesSection"
import { ListingCarousel } from "@/components/homepage/ListingCarousel"
import { ArchitectSection } from "@/components/homepage/ArchitectSection"
import { WorkflowSection } from "@/components/homepage/WorkflowSection"
import { CreatorsSection } from "@/components/homepage/CreatorsSection"
import { CTASection } from "@/components/homepage/CTASection"

export const revalidate = 60

async function getHomePageData() {
  try {
    const supabase = createPublicClient()

    const [
      listingsResult,
      categoriesResult,
      countResult,
      creatorsResult,
      trendingResult,
      featuredResult,
    ] = await Promise.all([
      supabase
        .from("listings")
        .select(
          `id, title, seo_title, description, short_description, type, price, downloads, views,
          average_rating, review_count, images, tags, updated_at, created_at, featured,
          creator:users!listings_creator_id_fkey(id, name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified))`
        )
        .eq("status", "ACTIVE")
        .order("downloads", { ascending: false, nullsFirst: false })
        .limit(30),
      supabase.from("categories").select("id, name, slug, listings(count)").eq("is_active", true).order("name"),
      supabase.from("listings").select("id, downloads, creator_id", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabase
        .from("creators")
        .select(
          "user_id, verified, total_revenue, followers_count, avatar_url, users!creators_user_id_fkey(name), listings:users!creators_user_id_fkey(listings(title, downloads, average_rating))"
        )
        .eq("verified", true)
        .order("total_revenue", { ascending: false, nullsFirst: false })
        .limit(8),
      supabase.from("listings").select("id, title, downloads, average_rating, review_count, images, type, price, creator:users!listings_creator_id_fkey(name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified))").eq("status", "ACTIVE").order("downloads", { ascending: false, nullsFirst: false }).limit(12),
      supabase.from("listings").select("id, title, downloads, average_rating, review_count, images, type, price, creator:users!listings_creator_id_fkey(name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified))").eq("status", "ACTIVE").eq("featured", true).order("quality_score", { ascending: false, nullsFirst: false }).limit(12),
    ])

    const listings = listingsResult.data ?? []
    const categories = categoriesResult.data ?? []
    const rows = countResult.data ?? []
    const creatorRows = creatorsResult.data ?? []

    const totalListings = countResult.count ?? rows.length
    const totalCreators = new Set(rows.map((r: any) => r.creator_id)).size
    const totalDownloads = rows.reduce((sum: number, r: any) => sum + (r.downloads ?? 0), 0)
    const avgRating =
      listings.reduce((sum: number, l: any) => sum + (l.average_rating ?? 0), 0) /
      Math.max(1, listings.filter((l: any) => (l.average_rating ?? 0) > 0).length)

    const categoryCounts: Record<string, number> = {}
    for (const c of categories as any[]) {
      categoryCounts[c.slug] = c.listings?.[0]?.count ?? 0
    }

    const creators: CreatorItem[] = (creatorRows as any[]).map((c) => {
      const listingsArr = Array.isArray(c.listings) ? c.listings : []
      const totalDownloads = listingsArr.reduce((sum: number, l: any) => sum + (l.downloads ?? 0), 0)
      const ratings = listingsArr.filter((l: any) => (l.average_rating ?? 0) > 0).map((l: any) => l.average_rating as number)
      const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
      return {
        id: c.user_id,
        name: c.users?.name ?? null,
        slug: null,
        avatar_url: c.avatar_url ?? c.users?.avatar_url ?? null,
        verified: c.verified ?? false,
        listingCount: listingsArr.length,
        totalDownloads,
        totalRating: avgRating,
        featuredListing: listingsArr[0]?.title ?? null,
      }
    })

    return {
      totalListings,
      totalCreators,
      totalDownloads,
      averageRating: avgRating,
      categoryCounts,
      creators,
      listings: normalizeListings(listings),
      trending: normalizeListings(trendingResult.data ?? []),
      featured: normalizeListings(featuredResult.data ?? []),
    }
  } catch (error) {
    console.error("Homepage data error:", error)
    return {
      totalListings: 0,
      totalCreators: 0,
      totalDownloads: 0,
      averageRating: 0,
      categoryCounts: {},
      creators: [],
      listings: [],
      trending: [],
      featured: [],
    }
  }
}

function normalizeListings(rows: any[]): MarketplaceCardData[] {
  return rows.map((item) => {
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

export default async function HomePage() {
  const {
    totalListings,
    totalCreators,
    totalDownloads,
    averageRating,
    categoryCounts,
    creators,
    trending,
    featured,
  } = await getHomePageData()

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <div className="noise-overlay" />

      <HeroSection totalListings={totalListings} />
      <StatsSection
        totalListings={totalListings}
        totalCreators={totalCreators}
        totalDownloads={totalDownloads}
        averageRating={averageRating}
      />
      <CategoriesSection counts={categoryCounts} />
      <FeaturesSection />

      <ListingCarousel title="Trending Skills" subtitle="Most installed assets this week" listings={trending} />
      <ListingCarousel title="Fresh & Featured" subtitle="Editor's picks, new arrivals, and highest-rated assets" listings={featured} />

      <ArchitectSection />
      <WorkflowSection />
      <CreatorsSection creators={creators} />
      <CTASection />
    </div>
  )
}
