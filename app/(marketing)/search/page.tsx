import { Search, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingGrid } from "@/components/ui/loading"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"

async function getCategories() {
  try {
    const supabase = await createClient()
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }
    
    return categories || []
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
}

async function getListings(searchParams?: { query?: string; type?: string; sort?: string; minPrice?: string; maxPrice?: string; minRating?: string }) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'ACTIVE')
    
    if (searchParams?.query) {
      query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%`)
    }
    
    if (searchParams?.type) {
      query = query.eq('type', searchParams.type)
    }
    
    // Price range filter
    if (searchParams?.minPrice) {
      query = query.gte('price', parseFloat(searchParams.minPrice))
    }
    if (searchParams?.maxPrice) {
      query = query.lte('price', parseFloat(searchParams.maxPrice))
    }
    
    // Rating filter
    if (searchParams?.minRating) {
      query = query.gte('average_rating', parseFloat(searchParams.minRating))
    }
    
    // Sort by different criteria
    if (searchParams?.sort === 'downloads') {
      query = query.order('downloads', { ascending: false })
    } else if (searchParams?.sort === 'price-low') {
      query = query.order('price', { ascending: true })
    } else if (searchParams?.sort === 'price-high') {
      query = query.order('price', { ascending: false })
    } else if (searchParams?.sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (searchParams?.sort === 'rating') {
      query = query.order('average_rating', { ascending: false })
    } else if (searchParams?.sort === 'reviews') {
      query = query.order('review_count', { ascending: false })
    } else {
      query = query.order('downloads', { ascending: false })
    }
    
    const { data: listings, error } = await query
    
    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getListings:', error)
    return []
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; type?: string; sort?: string; minPrice?: string; maxPrice?: string; minRating?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const categories = await getCategories()
  const listings = await getListings(resolvedParams)
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-12 text-text-primary animate-fade-in-up">Search</h1>
          
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
              <Input
                type="search"
                placeholder="Search for skills, plugins, agents..."
                className="h-14 pl-12 text-lg"
                defaultValue={resolvedParams?.query}
                name="query"
              />
              <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10">
                Search
              </Button>
            </form>
          </div>

          <Suspense fallback={<LoadingGrid count={6} />}>
            <SearchResults resolvedParams={resolvedParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function SearchResults({ resolvedParams }: { resolvedParams?: { query?: string; type?: string; sort?: string; minPrice?: string; maxPrice?: string; minRating?: string } }) {
  const categories = await getCategories()
  const listings = await getListings(resolvedParams)

  return (
    <>
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Filters</h2>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-text-tertiary" />
            <select
              name="sort"
              defaultValue={resolvedParams?.sort || 'downloads'}
              className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta"
            >
              <option value="downloads">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
        
        {/* Type Filters */}
        <div className="flex gap-3 flex-wrap mb-4">
          <Button variant={!resolvedParams?.type ? 'default' : 'outline'} className="transition-smooth" asChild>
            <a href="/search">All Types</a>
          </Button>
          {categories.map((category: any) => (
            <Button 
              key={category.id} 
              variant={resolvedParams?.type === category.name ? 'default' : 'outline'}
              className="transition-smooth"
              asChild
            >
              <a href={`/search?type=${category.name}&sort=${resolvedParams?.sort || 'downloads'}&minPrice=${resolvedParams?.minPrice || ''}&maxPrice=${resolvedParams?.maxPrice || ''}&minRating=${resolvedParams?.minRating || ''}`}>{category.name}</a>
            </Button>
          ))}
        </div>

        {/* Price Range Filter */}
        <div className="flex gap-3 items-center mb-4">
          <span className="text-sm text-text-tertiary">Price:</span>
          <Input
            type="number"
            placeholder="Min"
            name="minPrice"
            defaultValue={resolvedParams?.minPrice}
            className="w-24 h-9"
            min="0"
          />
          <span className="text-text-tertiary">-</span>
          <Input
            type="number"
            placeholder="Max"
            name="maxPrice"
            defaultValue={resolvedParams?.maxPrice}
            className="w-24 h-9"
            min="0"
          />
        </div>

        {/* Rating Filter */}
        <div className="flex gap-3 items-center">
          <span className="text-sm text-text-tertiary">Min Rating:</span>
          <select
            name="minRating"
            defaultValue={resolvedParams?.minRating || ''}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta"
          >
            <option value="">Any</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {listings.map((listing: any, index: number) => (
          <Card key={listing.id} className="glass hover:shadow-glow transition-smooth group" style={{ animationDelay: `${index * 0.05}s` }}>
            <CardHeader className="space-y-4">
              <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                ) : (
                  <span className="text-text-tertiary text-sm">Preview</span>
                )}
              </div>
              <CardTitle className="text-2xl text-text-primary">{listing.title}</CardTitle>
              <CardDescription className="text-base text-text-secondary">{listing.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-text-primary">${listing.price}</span>
                <Button className="group-hover:shadow-glow transition-smooth" asChild>
                  <a href={`/listing/${listing.id}`}>View Details</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {listings.length === 0 && (
        <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-xl text-text-secondary mb-4">No listings found matching your criteria.</p>
          <p className="text-text-tertiary">Try adjusting your search terms or filters</p>
        </div>
      )}
      
      {listings.length > 0 && (
        <div className="mt-8 text-center text-text-tertiary animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          Found {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
        </div>
      )}
    </>
  )
}
