export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Heart, Share2, Star, ArrowLeft, Eye, Calendar, Tag, User } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

async function getListing(id: string) {
  try {
    const supabase = await createClient()
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        reviews(id, rating, comment, created_at, user_id)
      `)
      .eq('id', id)
      .single()

    if (error || !listing) {
      return null
    }

    return listing
  } catch {
    return null
  }
}

async function getCreator(userId: string) {
  try {
    const supabase = await createClient()
    const { data: creator } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (creator) return creator

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    return user
  } catch {
    return null
  }
}

async function getRelatedListings(type: string, currentId: string) {
  try {
    const supabase = await createClient()
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, price, downloads, type')
      .eq('type', type)
      .eq('status', 'ACTIVE')
      .neq('id', currentId)
      .order('downloads', { ascending: false })
      .limit(4)

    return listings || []
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SKILL: 'Claude Skill',
    PLUGIN: 'Cursor Rule',
    MCP: 'MCP Server',
    AGENT: 'AI Agent',
    PROMPT: 'Prompt Pack',
    WORKFLOW: 'Workflow',
    TEMPLATE: 'Template',
    AUTOMATION: 'Automation',
    DEVELOPER_TOOL: 'Developer Tool',
  }
  return labels[type] || type
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    notFound()
  }

  const creator = await getCreator(listing.creator_id)
  const relatedListings = await getRelatedListings(listing.type, listing.id)

  const reviews = listing.reviews || []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <Link href="/search" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-smooth mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border text-xs font-medium text-cta mb-4">
                  <Tag className="h-3 w-3" />
                  {getTypeLabel(listing.type)}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">{listing.title}</h1>
                <p className="text-lg text-text-secondary leading-relaxed">{listing.description}</p>
              </div>

              <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="aspect-video bg-surface rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center">
                        <Eye className="h-12 w-12 text-text-tertiary mx-auto mb-2" />
                        <span className="text-text-tertiary text-sm">No preview available</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 h-12 text-base shadow-glow">
                      <Download className="mr-2 h-5 w-5" />
                      {listing.price > 0 ? `Purchase - $${listing.price}` : 'Download Free'}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>

              {reviews.length > 0 && (
                <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <CardHeader>
                    <CardTitle className="text-2xl text-text-primary">Reviews ({reviews.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reviews.map((review: { id: string; rating: number; comment: string | null; created_at: string }) => (
                        <div key={review.id} className="p-4 bg-surface rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className={`h-4 w-4 ${j < review.rating ? 'fill-cta text-cta' : 'text-text-tertiary'}`} />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-text-secondary text-sm">{review.comment}</p>
                          )}
                          <p className="text-xs text-text-tertiary mt-2">{formatDate(review.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {relatedListings.length > 0 && (
                <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <CardHeader>
                    <CardTitle className="text-2xl text-text-primary">Related Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedListings.map((related: { id: string; title: string; price: number; downloads: number | null; type: string }) => (
                        <Link key={related.id} href={`/listing/${related.id}`} className="p-4 bg-surface rounded-xl hover:bg-elevated transition-smooth group">
                          <p className="font-medium text-text-primary group-hover:text-cta transition-smooth">{related.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-tertiary">
                            <span>${related.price}</span>
                            <span>{related.downloads || 0} downloads</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="glass sticky top-24 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-tertiary">Price</span>
                    <span className="text-2xl font-bold text-cta">
                      {listing.price > 0 ? `$${listing.price}` : 'Free'}
                    </span>
                  </div>
                  <div className="border-t border-border" />
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Type</span>
                    <span className="text-text-primary">{getTypeLabel(listing.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Downloads</span>
                    <span className="text-text-primary">{listing.downloads || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Views</span>
                    <span className="text-text-primary">{listing.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className={`h-4 w-4 ${avgRating > 0 ? 'fill-cta text-cta' : 'text-text-tertiary'}`} />
                      <span className="text-text-primary">{avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}</span>
                      <span className="text-text-tertiary text-sm">({reviews.length})</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Status</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      listing.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                      listing.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>{listing.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Published</span>
                    <span className="text-text-primary text-sm">{formatDate(listing.created_at)}</span>
                  </div>
                  {listing.updated_at && listing.updated_at !== listing.created_at && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Updated</span>
                      <span className="text-text-primary text-sm">{formatDate(listing.updated_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {creator && (
                <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <CardHeader>
                    <CardTitle className="text-xl text-text-primary">Creator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cta to-cta-light flex items-center justify-center text-primary font-bold text-lg">
                        {(creator.display_name || creator.name || creator.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{creator.display_name || creator.name || 'Creator'}</p>
                        {creator.verified && (
                          <span className="text-xs text-cta font-medium">Verified</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
