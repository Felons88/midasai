import { createClient } from "@/lib/supabase/server"
import { ShoppingBag, ExternalLink, Download, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function getPurchases(userId: string) {
  try {
    const supabase = await createClient()
    const { data: purchases, error } = await supabase
      .from('transactions')
      .select(`
        *,
        listings(id, title, description, type, price, images, downloads, reviews(rating))
      `)
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching purchases:', error)
      return []
    }
    
    return purchases || []
  } catch (error) {
    console.error('Error in getPurchases:', error)
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

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const purchases = await getPurchases(user.id)
  const purchasesWithRatings = await Promise.all(
    purchases.map(async (purchase: any) => {
      const ratingData = await getAverageRating(purchase.listing_id)
      return {
        ...purchase,
        averageRating: ratingData.rating,
        reviewCount: ratingData.count
      }
    })
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Purchases</h1>
        <p className="text-white/50 text-sm">Everything you have purchased on MidasAI</p>
      </div>

      {purchasesWithRatings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <ShoppingBag className="h-12 w-12 text-white/20 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">No purchases yet</h2>
          <p className="text-sm text-white/40 mb-4">Browse the marketplace to find useful AI tools.</p>
          <Button asChild>
            <Link href="/explore">
              Explore marketplace
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasesWithRatings.map((purchase: any) => (
            <Card key={purchase.id} className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <CardHeader className="space-y-4">
                <CardTitle className="text-xl text-white">{purchase.listings?.title}</CardTitle>
                <CardDescription className="text-sm text-white/50">{purchase.listings?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${j < Math.floor(purchase.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{purchase.averageRating.toFixed(1)} ({purchase.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">${purchase.listings?.price}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/listing/${purchase.listing_id}`}>View</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/download/${purchase.listing_id}`}>
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
