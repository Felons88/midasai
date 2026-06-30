import { FolderOpen, Plus, Edit, Trash2, Folder } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

async function getUserCollections(userId: string) {
  try {
    const supabase = await createClient()
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_items(count),
        bookmarks(listings(id, title, images))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching collections:', error)
      return []
    }
    
    return collections || []
  } catch (error) {
    console.error('Error in getUserCollections:', error)
    return []
  }
}

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const collections = await getUserCollections(user.id)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Collections</h1>
          <p className="text-white/50 text-sm">Organize your saved assets into collections</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection: any) => (
            <Card key={collection.id} className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Folder className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Edit className="h-4 w-4 text-white/40" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-white/40" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl text-white">{collection.name}</CardTitle>
                <CardDescription className="text-sm text-white/50">
                  {collection.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">
                    {collection.collection_items?.[0]?.count || 0} items
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/collections/${collection.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/50 mb-2">No collections yet</p>
          <p className="text-white/30 text-sm mb-6">Create a collection to organize your bookmarked assets</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Collection
          </Button>
        </div>
      )}
    </div>
  )
}
