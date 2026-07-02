import { notFound } from "next/navigation"
import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard"
import { Download, Star, Sparkles } from "lucide-react"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; q?: string }>
}

async function getCategory(slug: string) {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !data) return null
  return data
}

async function getCategoryListings(
  slug: string,
  sort: string = "downloads",
  query?: string
) {
  const supabase = createPublicClient()

  if (query && query.trim()) {
    const { data, error } = await supabase.rpc("search_listings_by_category", {
      p_category_slug: slug,
      p_query: query.trim(),
      p_status: "ACTIVE",
      p_limit: 24,
    })
    if (error) {
      console.error("search_listings_by_category error:", error)
      return []
    }
    return data ?? []
  }

  const { data, error } = await supabase.rpc("get_listings_by_category", {
    p_category_slug: slug,
    p_status: "ACTIVE",
    p_limit: 24,
    p_offset: 0,
    p_sort: sort,
  })

  if (error) {
    console.error("get_listings_by_category error:", error)
    return []
  }

  return data ?? []
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: "Category Not Found" }

  return {
    title: `${category.name} — MidasAI Marketplace`,
    description: category.description,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { sort = "downloads", q } = await searchParams
  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  const listings = await getCategoryListings(slug, sort, q)

  const sorts = [
    { value: "downloads", label: "Most Installed" },
    { value: "newest", label: "Newest" },
    { value: "highest_rated", label: "Highest Rated" },
    { value: "featured", label: "Featured" },
    { value: "updated", label: "Recently Updated" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-cta" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary">{category.name}</h1>
              <p className="text-text-secondary mt-1">{category.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          {sorts.map((s) => (
            <Link
              key={s.value}
              href={`/category/${slug}?sort=${s.value}`}
              className={`px-3 py-1.5 rounded-full text-sm border transition-smooth ${
                sort === s.value
                  ? "bg-cta/10 border-cta/30 text-cta"
                  : "bg-white/5 border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-24 animate-fade-in-up">
            <p className="text-xl text-text-secondary">No active listings in this category yet.</p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 mt-4 text-cta hover:text-cta-light transition-smooth"
            >
              Explore marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {listings.map((listing: any, index: number) => (
              <MarketplaceCard
                key={listing.id}
                listing={{
                  ...listing,
                  creator: listing.creator,
                }}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
