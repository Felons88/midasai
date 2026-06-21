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
    return null
  }
  
  const bookmarks = await getUserBookmarks(user.id)

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bookmark className="h-8 w-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">Bookmarks</h1>
        </div>
        <p className="text-white/50">Your saved listings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.map((bookmark: any) => (
          <Card key={bookmark.id} className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <CardHeader className="space-y-4">
              <div className="aspect-video bg-white/[0.04] rounded-xl flex items-center justify-center overflow-hidden">
                {bookmark.listings?.images && bookmark.listings.images.length > 0 ? (
                  <img src={bookmark.listings.images[0]} alt={bookmark.listings?.title} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-white/30 text-sm">Preview</span>
                )}
              </div>
              <CardTitle className="text-xl text-white">{bookmark.listings?.title}</CardTitle>
              <CardDescription className="text-sm text-white/50">{bookmark.listings?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">${bookmark.listings?.price}</span>
                  <span className="text-xs text-white/30 ml-2">{bookmark.listings?.type}</span>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/listing/${bookmark.listings?.id}`}>View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {bookmarks.length === 0 && (
        <div className="text-center py-24">
          <Bookmark className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-xl text-white/30">No bookmarks yet.</p>
          <p className="text-white/20 mt-2">Browse the marketplace and save items you like.</p>
          <Button className="mt-6" asChild>
            <Link href="/explore">Browse Marketplace</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
