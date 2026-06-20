export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

async function getAgentsListings() {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('type', 'AGENT')
      .eq('status', 'ACTIVE')
      .order('downloads', { ascending: false })
    
    if (error) {
      console.error('Error fetching agents listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getAgentsListings:', error)
    return []
  }
}

export default async function AgentsPage() {
  const listings = await getAgentsListings()
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">AI Agents</h1>
          <p className="text-xl text-text-secondary">
            Autonomous AI agents for automation and task execution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {listings.map((listing: any, index: number) => (
            <Card key={listing.id} className="glass hover:shadow-glow transition-smooth group" style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader className="space-y-4">
                <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                  ) : (
                    <span className="text-text-tertiary text-sm">Preview</span>
                  )}
                </div>
                <CardTitle className="text-2xl text-text-primary">{listing.title}</CardTitle>
                <CardDescription className="text-base text-text-secondary">{listing.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-text-primary">${listing.price}</span>
                    <span className="text-sm text-text-tertiary ml-2">{listing.downloads || 0} downloads</span>
                  </div>
                  <Button className="group-hover:shadow-glow transition-smooth" asChild>
                    <a href={`/listing/${listing.id}`}>View Details</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {listings.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl text-text-secondary">No AI agents found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
