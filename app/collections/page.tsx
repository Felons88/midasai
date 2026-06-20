import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getPublicCollections() {
  try {
    const supabase = await createClient()
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        users(name, avatar_url)
      `)
      .eq('public', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching collections:', error)
      return []
    }
    
    return collections || []
  } catch (error) {
    console.error('Error in getPublicCollections:', error)
    return []
  }
}

export default async function CollectionsPage() {
  const collections = await getPublicCollections()
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-8 w-8 text-cta" />
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Collections</h1>
          </div>
          <p className="text-xl text-text-secondary">
            Curated collections of AI tools and resources
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {collections.map((collection: any, index: number) => (
            <Card key={collection.id} className="glass hover:shadow-glow transition-smooth group" style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl text-text-primary">{collection.name}</CardTitle>
                <CardDescription className="text-base text-text-secondary">{collection.description || 'A curated collection of AI tools'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">by {collection.users?.name || 'Anonymous'}</span>
                  </div>
                  <Button className="group-hover:shadow-glow transition-smooth" asChild>
                    <Link href={`/collections/${collection.slug}`}>View Collection</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {collections.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl text-text-secondary">No public collections yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
