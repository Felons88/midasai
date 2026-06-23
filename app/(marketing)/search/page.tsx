import { createClient } from "@/lib/supabase/server"
import { MarketplaceSearch, type Listing, type InitialParams } from "./search-controls"

async function getActiveListings(): Promise<Listing[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, description, type, price, average_rating, review_count, downloads, tags, created_at, updated_at")
      .eq("status", "ACTIVE")
      .order("downloads", { ascending: false })
      .limit(500)
    if (error) {
      console.error("Error fetching listings:", error)
      return []
    }
    return (data as Listing[]) || []
  } catch (e) {
    console.error("Error in getActiveListings:", e)
    return []
  }
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<InitialParams> }) {
  const [listings, resolved] = await Promise.all([
    getActiveListings(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-text-primary">Explore the Marketplace</h1>
          <MarketplaceSearch initialListings={listings} initialParams={resolved} />
        </div>
      </div>
    </div>
  )
}
