import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Download, ExternalLink, Package, Star, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function getDownloads(userId: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('downloads')
      .select(`
        id, created_at, listing_id,
        listings(id, title, type, price, description, images, reviews(rating))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    return data || []
  } catch {
    return []
  }
}

async function getAverageRating(listingId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', listingId)
    
    if (error) {
      console.error('Error fetching rating:', error)
      return { rating: 0, count: 0 }
    }
    
    if (!data || data.length === 0) return { rating: 0, count: 0 }
    
    const totalRating = data.reduce((sum: number, r: any) => sum + r.rating, 0)
    return {
      rating: totalRating / data.length,
      count: data.length
    }
  } catch (error) {
    console.error('Error in getAverageRating:', error)
    return { rating: 0, count: 0 }
  }
}

export default async function DownloadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const downloads = await getDownloads(user.id)
  const downloadsWithRatings = await Promise.all(
    downloads.map(async (download: any) => {
      const ratingData = await getAverageRating(download.listing_id)
      return {
        ...download,
        averageRating: ratingData.rating,
        reviewCount: ratingData.count
      }
    })
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Downloads</h1>
          <p className="text-white/50 text-sm">Your downloaded assets and purchase history</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {downloadsWithRatings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Download className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/50 mb-2">No downloads yet</p>
          <p className="text-white/30 text-sm mb-6">Browse the marketplace to find great tools</p>
          <Button asChild>
            <Link href="/explore">
              Explore Assets
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloadsWithRatings.map((download: any) => (
            <Card key={download.id} className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <CardHeader className="space-y-4">
                <div className="aspect-video bg-white/[0.04] rounded-xl flex items-center justify-center overflow-hidden">
                  {download.listings?.images && download.listings.images.length > 0 ? (
                    <img src={download.listings.images[0]} alt={download.listings?.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-white/30 text-sm">Preview</span>
                  )}
                </div>
                <CardTitle className="text-xl text-white">{download.listings?.title}</CardTitle>
                <CardDescription className="text-sm text-white/50">{download.listings?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${j < Math.floor(download.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{download.averageRating.toFixed(1)} ({download.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/30">
                    Downloaded {new Date(download.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/listing/${download.listing_id}`}>View</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/download/${download.listing_id}`}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
