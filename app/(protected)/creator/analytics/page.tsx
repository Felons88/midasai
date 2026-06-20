import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

async function getAnalyticsData(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get total views from listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, views, downloads')
      .eq('creator_id', userId)
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }
    
    const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.views || 0), 0) || 0
    const totalDownloads = listings?.reduce((sum: number, l: any) => sum + (l.downloads || 0), 0) || 0
    
    // Get total sales from transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, status, created_at, listing_id')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }
    
    const completedTransactions = transactions?.filter((t: any) => t.status === 'COMPLETED') || []
    const totalSales = completedTransactions.length
    const totalRevenue = completedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    
    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : '0.00'
    
    // Get average rating from reviews
    const listingIds = listings?.map((l: any) => l.id) || []
    const { data: reviews, error: reviewsError } = listingIds.length > 0
      ? await supabase
          .from('reviews')
          .select('rating')
          .in('listing_id', listingIds)
      : { data: [], error: null }
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
    }
    
    const averageRating = reviews && reviews.length > 0 
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'
    
    // Get sales by listing
    const salesByListing = (listings || []).map((listing: any) => {
      const listingTransactions = completedTransactions.filter((t: any) => t.listing_id === listing.id)
      return {
        name: listing.title,
        sales: listingTransactions.length,
        revenue: listingTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      }
    })
    
    // Sort by sales and take top 5
    const topListings = salesByListing
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
    
    // Recent transactions (latest 10)
    const recentTransactions = (transactions || []).slice(0, 10).map((t: any) => {
      const listing = listings?.find((l: any) => l.id === t.listing_id)
      return {
        status: t.status,
        amount: t.amount,
        listing_title: listing?.title || 'Unknown',
        created_at: t.created_at
      }
    })
    
    return {
      totalViews,
      totalSales,
      conversionRate,
      averageRating,
      topListings,
      totalReviews: reviews?.length || 0,
      recentTransactions
    }
  } catch (error) {
    console.error('Error in getAnalyticsData:', error)
    return {
      totalViews: 0,
      totalSales: 0,
      conversionRate: '0.00',
      averageRating: '0.0',
      topListings: [],
      totalReviews: 0,
      recentTransactions: []
    }
  }
}

export default async function CreatorAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your analytics.</p>
        </div>
      </div>
    )
  }
  
  const data = await getAnalyticsData(user.id)
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Analytics</h1>
          <p className="text-xl text-text-secondary">Track your listing performance</p>
        </div>

        <div className="bento-grid mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Views</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{data.totalViews.toLocaleString()}</CardTitle>
              <CardDescription className="text-xs text-cta">Page views across all listings</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Sales</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{data.totalSales}</CardTitle>
              <CardDescription className="text-xs text-cta">Completed transactions</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Conversion Rate</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{data.conversionRate}%</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Sales / Views</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Avg. Rating</CardTitle>
              <CardTitle className="text-4xl text-cta">{data.averageRating}</CardTitle>
              <CardDescription className="text-xs text-text-tertiary">Based on {data.totalReviews} reviews</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Sales by Listing</CardTitle>
              <CardDescription className="text-text-secondary">Top performing listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topListings.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">{item.name}</span>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">{item.sales} sales</p>
                      <p className="text-sm text-text-tertiary">${item.revenue}</p>
                    </div>
                  </div>
                ))}
                {data.topListings.length === 0 && (
                  <p className="text-sm text-text-tertiary">No sales data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Recent Activity</CardTitle>
              <CardDescription className="text-text-secondary">Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentTransactions.map((activity: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className={`font-medium ${activity.status === 'COMPLETED' ? 'text-cta' : activity.status === 'REFUNDED' ? 'text-red-400' : 'text-text-primary'}`}>
                        {activity.status}
                      </span>
                      <span className="text-text-tertiary"> - {activity.listing_title}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-text-primary">${activity.amount}</span>
                      <p className="text-xs text-text-tertiary">{new Date(activity.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {data.recentTransactions.length === 0 && (
                  <p className="text-sm text-text-tertiary">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
