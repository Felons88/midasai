import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

async function getAnalyticsData(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get total views from listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('views, downloads')
      .eq('creator_id', userId)
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }
    
    const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.views || 0), 0) || 0
    const totalDownloads = listings?.reduce((sum: number, l: any) => sum + (l.downloads || 0), 0) || 0
    
    // Get total sales from transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, status')
      .eq('creator_id', userId)
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }
    
    const completedTransactions = transactions?.filter((t: any) => t.status === 'COMPLETED') || []
    const totalSales = completedTransactions.length
    const totalRevenue = completedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    
    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : '0.00'
    
    // Get average rating from reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .in('listing_id', listings?.map((l: any) => l.id) || [])
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
    }
    
    const averageRating = reviews && reviews.length > 0 
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'
    
    // Get sales by listing
    const salesByListing = await Promise.all(
      (listings || []).map(async (listing: any) => {
        const { data: sales } = await supabase
          .from('transactions')
          .select('amount')
          .eq('listing_id', listing.id)
          .eq('status', 'COMPLETED')
        
        const salesCount = sales?.length || 0
        const revenue = sales?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
        
        return {
          name: listing.title,
          sales: salesCount,
          revenue
        }
      })
    )
    
    // Sort by sales and take top 5
    const topListings = salesByListing
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
    
    return {
      totalViews,
      totalSales,
      conversionRate,
      averageRating,
      topListings,
      totalReviews: reviews?.length || 0
    }
  } catch (error) {
    console.error('Error in getAnalyticsData:', error)
    return {
      totalViews: 0,
      totalSales: 0,
      conversionRate: '0.00',
      averageRating: '0.0',
      topListings: [],
      totalReviews: 0
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
              <CardDescription className="text-text-secondary">Latest views and purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Purchase", item: "AI Agent Builder", time: "2 hours ago" },
                  { action: "View", item: "Claude Skill Pack Pro", time: "3 hours ago" },
                  { action: "Purchase", item: "Cursor Rules for React", time: "5 hours ago" },
                  { action: "View", item: "MCP Server Template", time: "6 hours ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-text-primary">{activity.action}</span>
                      <span className="text-text-tertiary"> - {activity.item}</span>
                    </div>
                    <span className="text-text-tertiary">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
