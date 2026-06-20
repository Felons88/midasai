export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getUserBookmarks(userId: string) {
  try {
    const supabase = await createClient()
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        listings(id, title, description, price, type)
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

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SKILL: 'Claude Skill', PLUGIN: 'Cursor Rule', MCP: 'MCP Server',
    AGENT: 'AI Agent', PROMPT: 'Prompt Pack', WORKFLOW: 'Workflow',
    TEMPLATE: 'Template', AUTOMATION: 'Automation', DEVELOPER_TOOL: 'Developer Tool',
  }
  return labels[type] || type
}

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative text-center">
          <Bookmark className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4 text-text-primary">Bookmarks</h1>
          <p className="text-xl text-text-secondary mb-8">Sign in to view your saved listings.</p>
          <Button asChild className="shadow-glow">
            <Link href="/auth/login">Sign In</Link>
          </Button>
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
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Bookmarks</h1>
          <p className="text-xl text-text-secondary">Your saved listings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {bookmarks.map((bookmark: { id: string; listings: { id: string; title: string; description: string; price: number; type: string } | null }) => {
            const listing = bookmark.listings
            if (!listing) return null
            return (
              <Card key={bookmark.id} className="glass hover:shadow-glow transition-smooth group">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-text-primary">{listing.title}</CardTitle>
                      <CardDescription className="text-text-secondary mt-1">{listing.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-text-primary">${listing.price}</span>
                      <span className="text-sm text-text-tertiary ml-2">{getTypeLabel(listing.type)}</span>
                    </div>
                    <Button className="group-hover:shadow-glow transition-smooth" asChild>
                      <Link href={`/listing/${listing.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {bookmarks.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Bookmark className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-xl text-text-secondary mb-4">No bookmarks yet.</p>
            <p className="text-text-tertiary mb-8">Browse the marketplace and save listings you're interested in.</p>
            <Button asChild>
              <Link href="/search">Browse Marketplace</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
