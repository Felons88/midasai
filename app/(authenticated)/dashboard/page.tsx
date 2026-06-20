import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Bookmark, Bell, Settings } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getUserStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get user's downloads count
    const { count: downloadsCount, error: downloadsError } = await supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (downloadsError) {
      console.error('Error fetching downloads count:', downloadsError)
    }
    
    // Get user's bookmarks count
    const { count: bookmarksCount, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (bookmarksError) {
      console.error('Error fetching bookmarks count:', bookmarksError)
    }
    
    // Get user's listings count
    const { count: listingsCount, error: listingsError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
    
    if (listingsError) {
      console.error('Error fetching listings count:', listingsError)
    }
    
    // Get user's revenue (sum of completed transactions)
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('creator_id', userId)
      .eq('status', 'COMPLETED')
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }
    
    const revenue = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
    
    return {
      downloads: downloadsCount || 0,
      bookmarks: bookmarksCount || 0,
      listings: listingsCount || 0,
      revenue
    }
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return { downloads: 0, bookmarks: 0, listings: 0, revenue: 0 }
  }
}

async function getRecentDownloads(userId: string) {
  try {
    const supabase = await createClient()
    const { data: downloads, error } = await supabase
      .from('downloads')
      .select(`
        *,
        listings(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching recent downloads:', error)
      return []
    }
    
    return downloads || []
  } catch (error) {
    console.error('Error in getRecentDownloads:', error)
    return []
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your dashboard.</p>
        </div>
      </div>
    )
  }
  
  const stats = await getUserStats(user.id)
  const recentDownloads = await getRecentDownloads(user.id)
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Dashboard</h1>
          <p className="text-xl text-text-secondary">Welcome back! Here's an overview of your account.</p>
        </div>

        <div className="bento-grid mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Downloads</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.downloads}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Bookmarks</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.bookmarks}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Listings</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.listings}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Revenue</CardTitle>
              <CardTitle className="text-4xl text-cta">${stats.revenue}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start transition-smooth" asChild>
                <Link href="/bookmarks">
                  <Bookmark className="mr-2 h-4 w-4" />
                  View Bookmarks
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start transition-smooth" asChild>
                <Link href="/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start transition-smooth" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Recent Downloads</CardTitle>
              <CardDescription className="text-text-secondary">Your latest purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDownloads.map((download: any) => (
                  <div key={download.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-cta" />
                      <div>
                        <p className="font-medium text-text-primary">{download.listings?.title || 'Unknown'}</p>
                        <p className="text-sm text-text-tertiary">
                          {new Date(download.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="transition-smooth" asChild>
                      <a href={`/listing/${download.listing_id}`}>View</a>
                    </Button>
                  </div>
                ))}
                {recentDownloads.length === 0 && (
                  <p className="text-sm text-text-tertiary">No downloads yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
