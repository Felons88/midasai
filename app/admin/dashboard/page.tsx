export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, FileText, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getAdminStats() {
  try {
    const supabase = await createClient()
    
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (usersError) {
      console.error('Error fetching total users:', usersError)
    }
    
    // Get total revenue from completed transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'COMPLETED')
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }
    
    const totalRevenue = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
    
    // Get total listings
    const { count: totalListings, error: listingsError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
    
    if (listingsError) {
      console.error('Error fetching total listings:', listingsError)
    }
    
    // Get pending listings (PENDING status)
    const { count: pendingListings, error: pendingError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING')
    
    if (pendingError) {
      console.error('Error fetching pending listings:', pendingError)
    }
    
    return {
      totalUsers: totalUsers || 0,
      totalRevenue,
      totalListings: totalListings || 0,
      pendingListings: pendingListings || 0
    }
  } catch (error) {
    console.error('Error in getAdminStats:', error)
    return { totalUsers: 0, totalRevenue: 0, totalListings: 0, pendingListings: 0 }
  }
}

async function getRecentUsers() {
  try {
    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching recent users:', error)
      return []
    }
    
    return users || []
  } catch (error) {
    console.error('Error in getRecentUsers:', error)
    return []
  }
}

async function getPendingListings() {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching pending listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getPendingListings:', error)
    return []
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()
  const recentUsers = await getRecentUsers()
  const pendingListings = await getPendingListings()
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Admin Dashboard</h1>
          <p className="text-xl text-text-secondary">Overview of platform statistics</p>
        </div>

        <div className="bento-grid mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Users</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Revenue</CardTitle>
              <CardTitle className="text-4xl text-cta">${stats.totalRevenue}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Total Listings</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.totalListings}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Pending Reviews</CardTitle>
              <CardTitle className="text-4xl text-text-primary">{stats.pendingListings}</CardTitle>
              <CardDescription className="text-xs text-cta">Needs attention</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Recent Registrations</CardTitle>
              <CardDescription className="text-text-secondary">Newest users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-cta" />
                      <div>
                        <p className="font-medium text-text-primary">{user.name || user.email}</p>
                        <p className="text-sm text-text-tertiary">
                          {new Date(user.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="transition-smooth">View</Button>
                  </div>
                ))}
                {recentUsers.length === 0 && (
                  <p className="text-sm text-text-tertiary">No recent registrations.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Pending Listings</CardTitle>
              <CardDescription className="text-text-secondary">Listings awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingListings.map((listing: any) => (
                  <div key={listing.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-cta" />
                      <div>
                        <p className="font-medium text-text-primary">{listing.title}</p>
                        <p className="text-sm text-text-tertiary">
                          {new Date(listing.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="transition-smooth">Review</Button>
                  </div>
                ))}
                {pendingListings.length === 0 && (
                  <p className="text-sm text-text-tertiary">No pending listings.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">Platform Alerts</CardTitle>
            <CardDescription className="text-text-secondary">Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingListings > 0 && (
                <div className="flex items-center gap-3 p-4 bg-surface rounded-xl">
                  <AlertCircle className="h-5 w-5 text-cta" />
                  <div>
                    <p className="font-medium text-text-primary">Pending Listings Review</p>
                    <p className="text-sm text-text-tertiary">{stats.pendingListings} listings awaiting review</p>
                  </div>
                </div>
              )}
              {stats.pendingListings === 0 && (
                <p className="text-sm text-text-tertiary">No platform alerts at this time.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
