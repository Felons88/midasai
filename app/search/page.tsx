export const dynamic = 'force-dynamic'
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

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

async function getListings(searchParams?: { query?: string; type?: string }) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'ACTIVE')
    
    if (searchParams?.query) {
      query = query.ilike('title', `%${searchParams.query}%`)
    }
    
    if (searchParams?.type) {
      query = query.eq('type', searchParams.type)
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
  searchParams: Promise<{ query?: string; type?: string }>
}) {
  const resolvedParams = await searchParams
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
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
              <Input
                type="search"
                placeholder="Search for skills, plugins, agents..."
                className="h-14 pl-12 text-lg"
                defaultValue={resolvedParams?.query}
                name="query"
              />
            </div>
          </div>

          <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-semibold mb-6 text-text-primary">Filters</h2>
            <div className="flex gap-3 flex-wrap">
              <Button variant={resolvedParams?.type ? 'outline' : 'default'} className="transition-smooth" asChild>
                <a href="/search">All Types</a>
              </Button>
              {categories.map((category: any) => (
                <Button 
                  key={category.id} 
                  variant={resolvedParams?.type === category.name ? 'default' : 'outline'}
                  className="transition-smooth"
                  asChild
                >
                  <a href={`/search?type=${category.name}`}>{category.name}</a>
                </Button>
              ))}
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
              <p className="text-xl text-text-secondary">No listings found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
