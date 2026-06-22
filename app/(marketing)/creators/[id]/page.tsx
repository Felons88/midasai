import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Link as LinkIcon, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FollowButton } from "@/components/creator/follow-button"

async function getFollowState(creatorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isAuthenticated: false, isFollowing: false }
  }

  const { data: follow } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', creatorId)
    .maybeSingle()

  return { isAuthenticated: true, isFollowing: !!follow }
}

async function getCreator(userId: string) {
  try {
    const supabase = await createClient()
    const { data: creator, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching creator:', error)
      return null
    }

    return creator
  } catch (error) {
    console.error('Error in getCreator:', error)
    return null
  }
}

async function getCreatorListings(userId: string) {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('creator_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }

    return listings || []
  } catch (error) {
    console.error('Error in getCreatorListings:', error)
    return []
  }
}

async function getCreatorStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    // Get all creator's listings
    const { data: creatorListings } = await supabase
      .from('listings')
      .select('id')
      .eq('creator_id', userId)
      .eq('status', 'ACTIVE')

    // Get total downloads for creator's listings
    let downloadCount = 0
    if (creatorListings && creatorListings.length > 0) {
      const listingIds = creatorListings.map(l => l.id)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('listing_id')
        .in('listing_id', listingIds)
      
      downloadCount = transactions?.length || 0
    }

    // Get average rating
    const { data: listings } = await supabase
      .from('listings')
      .select('average_rating')
      .eq('creator_id', userId)
      .eq('status', 'ACTIVE')

    const avgRating = listings && listings.length > 0
      ? listings.reduce((sum, l) => sum + (l.average_rating || 0), 0) / listings.length
      : 0

    return {
      followerCount: followerCount || 0,
      downloadCount,
      avgRating,
      listingCount: listings?.length || 0,
    }
  } catch (error) {
    console.error('Error in getCreatorStats:', error)
    return {
      followerCount: 0,
      downloadCount: 0,
      avgRating: 0,
      listingCount: 0,
    }
  }
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const creator = await getCreator(id)

  if (!creator) {
    notFound()
  }

  const listings = await getCreatorListings(id)
  const stats = await getCreatorStats(id)
  const followState = await getFollowState(id)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          {/* Creator Header */}
          <div className="mb-12 animate-fade-in-up">
            <div className="glass rounded-2xl p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {creator.avatar_url ? (
                    <img 
                      src={creator.avatar_url} 
                      alt={creator.name || 'Creator'} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-cta/20"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-surface flex items-center justify-center border-4 border-cta/20">
                      <User className="h-16 w-16 text-text-tertiary" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-text-primary mb-2">
                    {creator.name || 'Creator'}
                  </h1>
                  {creator.bio && (
                    <p className="text-lg text-text-secondary mb-4">{creator.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">{stats.listingCount}</div>
                      <div className="text-sm text-text-tertiary">Listings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">{stats.followerCount}</div>
                      <div className="text-sm text-text-tertiary">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">{stats.downloadCount}</div>
                      <div className="text-sm text-text-tertiary">Downloads</div>
                    </div>
                    {stats.avgRating > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text-primary flex items-center gap-1">
                          {stats.avgRating.toFixed(1)}
                          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="text-sm text-text-tertiary">Avg Rating</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <FollowButton
                      creatorId={id}
                      isAuthenticated={followState.isAuthenticated}
                      initialIsFollowing={followState.isFollowing}
                    />
                    {creator.website && (
                      <Button variant="outline" asChild>
                    <a href={creator.website} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Portfolio</h2>
            
            {listings.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <p className="text-xl text-text-secondary">No listings yet</p>
                  <p className="text-text-tertiary mt-2">This creator hasn't published any listings.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <CardTitle className="text-xl text-text-primary">{listing.title}</CardTitle>
                      <CardDescription className="text-sm text-text-secondary line-clamp-2">{listing.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-text-primary">${listing.price}</span>
                        {listing.average_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm text-text-secondary">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            {listing.average_rating.toFixed(1)}
                            <span className="text-text-tertiary">({listing.review_count})</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full group-hover:shadow-glow transition-smooth" asChild>
                        <Link href={`/listing/${listing.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
