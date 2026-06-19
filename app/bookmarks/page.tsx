import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, Trash2 } from "lucide-react"

export default function BookmarksPage() {
  const bookmarks = [
    {
      id: 1,
      title: "Claude Skill Pack",
      description: "50+ professional prompts for various use cases",
      price: 19,
      type: "Claude Skills",
    },
    {
      id: 2,
      title: "MCP Server Pro",
      description: "Extend AI model capabilities with custom tools",
      price: 49,
      type: "MCP Servers",
    },
    {
      id: 3,
      title: "AI Agent Builder",
      description: "Build autonomous AI agents for automation",
      price: 99,
      type: "AI Agents",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved listings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{bookmark.title}</CardTitle>
                  <CardDescription>{bookmark.description}</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">${bookmark.price}</span>
                  <span className="text-sm text-muted-foreground ml-2">{bookmark.type}</span>
                </div>
                <Button>View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
