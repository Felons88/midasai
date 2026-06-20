import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Eye } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getAdminListings() {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        users!listings_creator_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error fetching admin listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getAdminListings:', error)
    return []
  }
}

export default async function AdminListingsPage() {
  const listings = await getAdminListings()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Listings Management</h1>
          <p className="text-xl text-text-secondary">Review and manage marketplace listings</p>
        </div>

        <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">All Listings ({listings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Listing</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Type</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Creator</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Price</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Created</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing: any) => (
                    <tr key={listing.id} className="border-b border-white/5 hover:bg-surface/50 transition-smooth">
                      <td className="p-4 font-medium text-text-primary">{listing.title}</td>
                      <td className="p-4 text-text-secondary text-sm">{listing.type}</td>
                      <td className="p-4 text-text-secondary text-sm">{listing.users?.name || listing.users?.email || 'Unknown'}</td>
                      <td className="p-4 text-text-primary font-medium">${listing.price}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-400'
                              : listing.status === 'PENDING'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : listing.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400'
                              : listing.status === 'DRAFT'
                              ? 'bg-gray-500/10 text-gray-400'
                              : 'bg-orange-500/10 text-orange-400'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="p-4 text-text-tertiary text-sm">{new Date(listing.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 transition-smooth" asChild>
                            <Link href={`/listing/${listing.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {listing.status === 'PENDING' && (
                            <>
                              <Button variant="outline" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300 transition-smooth">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 transition-smooth">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {listings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-tertiary">No listings found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
