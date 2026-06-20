import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Download, Bookmark, Package, TrendingUp, ArrowUpRight, Sparkles } from "lucide-react"

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
  
  if (!user) return null
  
  const stats = await getUserStats(user.id)
  const recentDownloads = await getRecentDownloads(user.id)
  
  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-white/50 text-sm">Here&apos;s what&apos;s happening with your account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Download className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Downloads</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.downloads}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Bookmarks</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.bookmarks}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Listings</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.listings}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">${stats.revenue}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/creator/upload" className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 transition-colors group">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Create New Listing</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
            </Link>
            <Link href="/explore" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">Explore Marketplace</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </Link>
            <Link href="/creator/analytics" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">View Analytics</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </Link>
            <Link href="/bookmarks" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <Bookmark className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">View Bookmarks</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Downloads */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Downloads</h2>
            <Link href="/downloads" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentDownloads.map((download: any) => (
              <div key={download.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Download className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{download.listings?.title || 'Unknown'}</p>
                  <p className="text-[11px] text-white/30">
                    {new Date(download.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/listing/${download.listing_id}`}
                  className="text-[11px] text-white/40 hover:text-amber-400 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
            {recentDownloads.length === 0 && (
              <div className="text-center py-8">
                <Download className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No downloads yet</p>
                <Link href="/explore" className="text-xs text-amber-400 hover:text-amber-300 mt-2 inline-block">
                  Browse marketplace →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
