import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"
import { createPublicClient } from "@/lib/supabase/server"

async function getTrendingListings() {
  try {
    const supabase = createPublicClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('downloads', { ascending: false })
      .limit(12)
    
    if (error) {
      console.error('Error fetching trending listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getTrendingListings:', error)
    return []
  }
}

export default async function TrendingPage() {
  const listings = await getTrendingListings()
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-8 w-8 text-cta" />
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Trending</h1>
          </div>
          <p className="text-xl text-text-secondary">
            Most popular AI tools right now
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {listings.map((listing: any, index: number) => (
            <Card key={listing.id} className="glass hover:shadow-glow transition-smooth group" style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="aspect-video flex-1 bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                    ) : (
                      <span className="text-text-tertiary text-sm">Preview</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl text-text-primary">{listing.title}</CardTitle>
                  <span className="text-sm font-bold text-cta bg-surface px-2 py-1 rounded-lg">#{index + 1}</span>
                </div>
                <CardDescription className="text-base text-text-secondary">{listing.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-text-primary">${listing.price}</span>
                    <span className="text-sm text-text-tertiary ml-2">{listing.downloads || 0} downloads</span>
                  </div>
                  <Button className="group-hover:shadow-glow transition-smooth" asChild>
                    <a href={`/listing/${listing.id}`}>View Details</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {listings.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl text-text-secondary">No trending listings yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
