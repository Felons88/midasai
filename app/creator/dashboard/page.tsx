import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, DollarSign, Eye, TrendingUp, Bell, Sparkles, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getCreatorStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get total revenue from completed transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, status')
      .eq('creator_id', userId)
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }
    
    const completedTransactions = transactions?.filter((t: any) => t.status === 'COMPLETED') || []
    const refundedTransactions = transactions?.filter((t: any) => t.status === 'REFUNDED') || []
    
    const totalRevenue = completedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    const totalRefunds = refundedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    
    // Get total sales count
    const totalSales = completedTransactions.length
    const totalRefundsCount = refundedTransactions.length
    
    // Get total views (sum of downloads across all listings)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('downloads, views')
      .eq('creator_id', userId)
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }
    
    const totalDownloads = listings?.reduce((sum: number, l: any) => sum + (l.downloads || 0), 0) || 0
    const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.views || 0), 0) || 0
    
    // Get active listings count
    const { count: activeListings, error: activeError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('status', 'ACTIVE')
    
    if (activeError) {
      console.error('Error fetching active listings:', activeError)
    }
    
    // Calculate conversion rate (sales / views)
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : '0.00'
    
    return {
      totalRevenue,
      totalSales,
      totalRefunds,
      totalRefundsCount,
      totalDownloads,
      totalViews,
      activeListings: activeListings || 0,
      conversionRate
    }
  } catch (error) {
    console.error('Error in getCreatorStats:', error)
    return { 
      totalRevenue: 0, 
      totalSales: 0, 
      totalRefunds: 0, 
      totalRefundsCount: 0, 
      totalDownloads: 0, 
      totalViews: 0, 
      activeListings: 0, 
      conversionRate: '0.00' 
    }
  }
}

async function getRecentSales(userId: string) {
  try {
    const supabase = await createClient()
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        listings(title)
      `)
      .eq('creator_id', userId)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching recent sales:', error)
      return []
    }
    
    return transactions || []
  } catch (error) {
    console.error('Error in getRecentSales:', error)
    return []
  }
}

async function getCreatorListings(userId: string) {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching creator listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getCreatorListings:', error)
    return []
  }
}

async function getTrendingAssets(userId: string) {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('creator_id', userId)
      .eq('status', 'ACTIVE')
      .order('downloads', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching trending assets:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getTrendingAssets:', error)
    return []
  }
}

async function getRecentActivity(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, type')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (transactionsError) {
      console.error('Error fetching recent activity:', transactionsError)
    }
    
    return transactions || []
  } catch (error) {
    console.error('Error in getRecentActivity:', error)
    return []
  }
}

async function getNotifications(userId: string) {
  try {
    const supabase = await createClient()
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
    
    return notifications || []
  } catch (error) {
    console.error('Error in getNotifications:', error)
    return []
  }
}

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your creator dashboard.</p>
        </div>
      </div>
    )
  }
  
  const stats = await getCreatorStats(user.id)
  const recentSales = await getRecentSales(user.id)
  const listings = await getCreatorListings(user.id)
  const trendingAssets = await getTrendingAssets(user.id)
  const recentActivity = await getRecentActivity(user.id)
  const notifications = await getNotifications(user.id)
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Creator Dashboard</h1>
          <p className="text-xl text-text-secondary">Manage your listings and track your performance</p>
        </div>

        <div className="bento-grid mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Revenue</CardTitle>
              <CardTitle className="text-4xl text-cta">${stats.totalRevenue}</CardTitle>
              <CardDescription className="text-xs text-cta">Gross revenue</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Sales</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.totalSales}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Completed transactions</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Downloads</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.totalDownloads}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Total asset downloads</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Views</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.totalViews}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Page views</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Conversion Rate</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.conversionRate}%</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Sales / Views</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Refunds</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.totalRefundsCount}</CardTitle>
              <CardDescription className="text-xs text-accent-red">${stats.totalRefunds} refunded</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Trending Assets</CardTitle>
              <CardDescription className="text-text-secondary">Your best performing assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingAssets.map((asset: any) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-medium text-text-primary">{asset.title}</p>
                      <p className="text-sm text-text-tertiary">{asset.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">{asset.downloads || 0}</p>
                      <p className="text-xs text-text-tertiary">downloads</p>
                    </div>
                  </div>
                ))}
                {trendingAssets.length === 0 && (
                  <p className="text-sm text-text-tertiary">No assets yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Recent Activity</CardTitle>
              <CardDescription className="text-text-secondary">Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{activity.status}</p>
                      <p className="text-sm text-text-tertiary">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`font-semibold ${activity.status === 'COMPLETED' ? 'text-cta' : activity.status === 'REFUNDED' ? 'text-accent-red' : 'text-text-tertiary'}`}>
                      ${activity.amount}
                    </span>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-text-tertiary">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Notifications</CardTitle>
              <CardDescription className="text-text-secondary">Unread notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification: any) => (
                  <div key={notification.id} className="p-4 bg-surface rounded-xl">
                    <p className="font-medium text-text-primary">{notification.title}</p>
                    <p className="text-sm text-text-tertiary">{notification.message}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-text-tertiary">No new notifications.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start transition-smooth" asChild>
                <Link href="/creator/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Listing
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start transition-smooth" asChild>
                <Link href="/creator/listings">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Manage Listings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start transition-smooth" asChild>
                <Link href="/creator/analytics">
                  <Eye className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start transition-smooth" asChild>
                <Link href="/creator/payouts">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Payouts
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Recent Sales</CardTitle>
              <CardDescription className="text-text-secondary">Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{sale.listings?.title || 'Unknown'}</p>
                      <p className="text-sm text-text-tertiary">
                        {new Date(sale.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-semibold text-cta">+${sale.amount}</span>
                  </div>
                ))}
                {recentSales.length === 0 && (
                  <p className="text-sm text-text-tertiary">No sales yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">AI Insights</CardTitle>
            <CardDescription className="text-text-secondary">AI-powered recommendations for your assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-surface rounded-xl">
                <Sparkles className="h-5 w-5 text-cta mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary">Optimize Your Listings</p>
                  <p className="text-sm text-text-secondary">Add more detailed descriptions and screenshots to increase conversion rates by up to 40%.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface rounded-xl">
                <TrendingUp className="h-5 w-5 text-cta mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary">Trending Opportunity</p>
                  <p className="text-sm text-text-secondary">AI Agents category is growing fast. Consider creating more agent-focused assets.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface rounded-xl">
                <AlertCircle className="h-5 w-5 text-cta mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary">Price Optimization</p>
                  <p className="text-sm text-text-secondary">Your average price point is below market. Consider increasing prices for premium assets.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
