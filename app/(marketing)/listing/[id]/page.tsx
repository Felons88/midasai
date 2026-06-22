import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Heart, Share2, Star, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getListing(id: string) {
  // Skip the query (and a needless Postgres type error) for ids that can't be a UUID.
  if (!UUID_RE.test(id)) {
    return null
  }

  try {
    const supabase = await createClient()
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        users!listings_creator_id_fkey(id, name, avatar_url),
        reviews(id, rating, comment, created_at, users(name, avatar_url)),
        categories(name, slug)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching listing:', error)
      return null
    }
    
    return listing
  } catch (error) {
    console.error('Error in getListing:', error)
    return null
  }
}

async function getCreatorListingCount(creatorId: string) {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .eq('status', 'ACTIVE')
    
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)
  
  if (!listing) {
    notFound()
  }
  
  const creatorListingCount = await getCreatorListingCount(listing.creator_id)
  
  const avgRating = listing.reviews?.length > 0
    ? listing.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / listing.reviews.length
    : 0
  const reviewCount = listing.reviews?.length || 0
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-5xl mx-auto">
          <Button variant="outline" className="mb-8 transition-smooth" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 animate-fade-in-up">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-text-primary">{listing.title}</h1>
                <p className="text-xl text-text-secondary">{listing.description}</p>
              </div>
              
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="aspect-video bg-surface rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-text-tertiary text-sm">No preview available</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 h-12 text-base shadow-glow">
                      <Download className="mr-2 h-5 w-5" />
                      {listing.price > 0 ? `Purchase — $${listing.price}` : 'Download Free'}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 transition-smooth">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 transition-smooth">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              {listing.reviews && listing.reviews.length > 0 && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-2xl text-text-primary">Reviews ({reviewCount})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {listing.reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-primary text-sm font-medium">
                            {review.users?.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-text-primary">{review.users?.name || 'Anonymous'}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-cta text-cta' : 'text-text-tertiary'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-text-tertiary ml-auto">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-text-secondary text-sm pl-11">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Card className="glass sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Type</span>
                    <span className="text-text-primary font-medium">{listing.type}</span>
                  </div>
                  {listing.categories && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Category</span>
                      <span className="text-text-primary">{listing.categories.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Price</span>
                    <span className="text-cta font-bold text-lg">
                      {listing.price > 0 ? `$${listing.price}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Downloads</span>
                    <div className="flex items-center gap-1.5 text-text-primary">
                      <Download className="h-4 w-4" />
                      {listing.downloads || 0}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Views</span>
                    <div className="flex items-center gap-1.5 text-text-primary">
                      <Eye className="h-4 w-4" />
                      {listing.views || 0}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Rating</span>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-cta text-cta" />
                      <span className="text-text-primary">{avgRating.toFixed(1)} ({reviewCount})</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Updated</span>
                    <span className="text-text-primary">{new Date(listing.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-cta font-bold text-lg">
                      {listing.users?.avatar_url ? (
                        <img src={listing.users.avatar_url} alt={listing.users?.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        listing.users?.name?.charAt(0) || '?'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{listing.users?.name || 'Anonymous'}</p>
                      <p className="text-sm text-text-tertiary">{creatorListingCount} listings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
