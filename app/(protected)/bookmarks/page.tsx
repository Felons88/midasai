import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getUserBookmarks(userId: string) {
  try {
    const supabase = await createClient()
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        listings(id, title, description, price, type, downloads, images)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bookmarks:', error)
      return []
    }
    
    return bookmarks || []
  } catch (error) {
    console.error('Error in getUserBookmarks:', error)
    return []
  }
}

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your bookmarks.</p>
        </div>
      </div>
    )
  }
  
  const bookmarks = await getUserBookmarks(user.id)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="h-8 w-8 text-cta" />
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Bookmarks</h1>
          </div>
          <p className="text-xl text-text-secondary">Your saved listings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {bookmarks.map((bookmark: any, index: number) => (
            <Card key={bookmark.id} className="glass hover:shadow-glow transition-smooth group" style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader className="space-y-4">
                <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                  {bookmark.listings?.images && bookmark.listings.images.length > 0 ? (
                    <img src={bookmark.listings.images[0]} alt={bookmark.listings?.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                  ) : (
                    <span className="text-text-tertiary text-sm">Preview</span>
                  )}
                </div>
                <CardTitle className="text-2xl text-text-primary">{bookmark.listings?.title}</CardTitle>
                <CardDescription className="text-base text-text-secondary">{bookmark.listings?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-text-primary">${bookmark.listings?.price}</span>
                    <span className="text-sm text-text-tertiary ml-2">{bookmark.listings?.type}</span>
                  </div>
                  <Button className="group-hover:shadow-glow transition-smooth" asChild>
                    <Link href={`/listing/${bookmark.listings?.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {bookmarks.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Bookmark className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-xl text-text-secondary">No bookmarks yet.</p>
            <p className="text-text-tertiary mt-2">Browse the marketplace and save items you like.</p>
            <Button className="mt-6" asChild>
              <Link href="/search">Browse Marketplace</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
