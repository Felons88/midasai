export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, Archive, Plus, DollarSign, MessageSquare } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getCreatorListings(userId: string) {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        transactions(amount, status)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching creator listings:', error)
      return []
    }
    
    // Calculate sales and revenue for each listing
    const listingsWithStats = listings?.map((listing: any) => {
      const sales = listing.transactions?.filter((t: any) => t.status === 'COMPLETED') || []
      const salesCount = sales.length
      const revenue = sales.reduce((sum: number, t: any) => sum + t.amount, 0)
      
      return {
        ...listing,
        sales: salesCount,
        revenue
      }
    }) || []
    
    return listingsWithStats
  } catch (error) {
    console.error('Error in getCreatorListings:', error)
    return []
  }
}

export default async function CreatorListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your listings.</p>
        </div>
      </div>
    )
  }
  
  const listings = await getCreatorListings(user.id)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">My Listings</h1>
            <p className="text-xl text-text-secondary">Manage your marketplace listings</p>
          </div>
          <Button asChild className="shadow-glow transition-smooth">
            <Link href="/creator/upload">
              <Plus className="h-4 w-4 mr-2" />
              Create New Listing
            </Link>
          </Button>
        </div>

        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {listings.map((listing) => (
            <Card key={listing.id} className="glass hover:shadow-glow transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-text-primary">{listing.title}</CardTitle>
                    <CardDescription className="text-text-secondary">{listing.type} • ${listing.price}</CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      listing.status === "Active"
                        ? "bg-surface text-cta border"
                        : "bg-surface text-text-tertiary border"
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm text-text-tertiary">
                    <span>{listing.views || 0} views</span>
                    <span>{listing.downloads || 0} downloads</span>
                    <span>{listing.sales} sales</span>
                    <span className="font-semibold text-cta">${listing.revenue} revenue</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="transition-smooth" asChild>
                      <Link href={`/listing/${listing.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="transition-smooth" asChild>
                      <Link href={`/creator/listings/${listing.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="transition-smooth" asChild>
                      <Link href={`/creator/listings/${listing.id}/pricing`}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pricing
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="transition-smooth" asChild>
                      <Link href={`/creator/listings/${listing.id}/reviews`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reviews
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="transition-smooth">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="outline" size="sm" className="transition-smooth">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
