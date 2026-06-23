import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, SearchX } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { LoadingGrid } from "@/components/ui/loading"
import { createClient } from "@/lib/supabase/server"
import { SearchControls } from "./search-controls"

const VALID_TYPES = new Set(["SKILL", "WORKFLOW", "TEMPLATE", "PLUGIN", "MCP", "AGENT"])

type Params = {
  query?: string; type?: string; sort?: string
  minPrice?: string; maxPrice?: string; minRating?: string; tag?: string
}

async function getListings(p?: Params) {
  try {
    const supabase = await createClient()
    let query = supabase.from("listings").select("*").eq("status", "ACTIVE")

    if (p?.query) query = query.or(`title.ilike.%${p.query}%,description.ilike.%${p.query}%`)
    if (p?.type && VALID_TYPES.has(p.type)) query = query.eq("type", p.type)
    if (p?.tag) query = query.contains("tags", [p.tag])
    if (p?.minPrice) query = query.gte("price", parseFloat(p.minPrice))
    if (p?.maxPrice) query = query.lte("price", parseFloat(p.maxPrice))
    if (p?.minRating) query = query.gte("average_rating", parseFloat(p.minRating))

    switch (p?.sort) {
      case "price-low": query = query.order("price", { ascending: true }); break
      case "price-high": query = query.order("price", { ascending: false }); break
      case "newest": query = query.order("created_at", { ascending: false }); break
      case "updated": query = query.order("updated_at", { ascending: false }); break
      case "rating": query = query.order("average_rating", { ascending: false }); break
      case "reviews": query = query.order("review_count", { ascending: false }); break
      default: query = query.order("downloads", { ascending: false }) // downloads + trending
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching listings:", error)
      return []
    }
    return data || []
  } catch (e) {
    console.error("Error in getListings:", e)
    return []
  }
}

// NOTE: intentionally NOT async / no top-level `await searchParams`. Awaiting here
// would suspend the whole route segment on every filter change and show the
// full-page route loader. Instead the shell renders immediately and only the
// results stream inside the nested Suspense for an instant-feeling experience.
export default function SearchPage({ searchParams }: { searchParams?: Promise<Params> }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-text-primary">Explore the Marketplace</h1>

          <div className="mb-10">
            <SearchControls />
          </div>

          <Suspense fallback={<LoadingGrid count={6} />}>
            <SearchResults searchParamsPromise={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function SearchResults({ searchParamsPromise }: { searchParamsPromise?: Promise<Params> }) {
  const resolved = searchParamsPromise ? await searchParamsPromise : undefined
  const listings = await getListings(resolved)

  if (listings.length === 0) {
    return (
      <div className="text-center py-24">
        <SearchX className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
        <p className="text-xl text-text-secondary mb-2">No listings match your filters</p>
        <p className="text-text-tertiary">Try a different search term, type, or price range.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 text-sm text-text-tertiary">
        {listings.length} {listings.length === 1 ? "result" : "results"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((l: any) => (
          <Card key={l.id} className="glass hover:shadow-glow transition-smooth group flex flex-col">
            <CardContent className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-cta bg-cta/10 px-2 py-0.5 rounded">{l.type}</span>
                {l.average_rating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-text-secondary">
                    <Star className="h-3.5 w-3.5 fill-cta text-cta" />{Number(l.average_rating).toFixed(1)}
                    <span className="text-text-tertiary">({l.review_count})</span>
                  </span>
                )}
              </div>
              <Link href={`/listing/${l.id}`} className="block">
                <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-1 group-hover:text-cta transition-colors">{l.title}</h3>
              </Link>
              <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">{l.description}</p>
              {Array.isArray(l.tags) && l.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {l.tags.slice(0, 3).map((t: string) => (
                    <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`} className="text-xs bg-white/[0.06] text-text-secondary px-2 py-0.5 rounded hover:text-text-primary transition-colors">#{t}</Link>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-bold text-text-primary">{l.price > 0 ? `$${l.price}` : "Free"}</span>
                <Button size="sm" className="group-hover:shadow-glow transition-smooth" asChild>
                  <Link href={`/listing/${l.id}`}>View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
