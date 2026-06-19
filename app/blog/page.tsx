import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function BlogPage() {
  const posts = [
    {
      title: "Getting Started with Claude Skills",
      excerpt: "Learn how to use Claude Skills to enhance your AI workflow",
      date: "2024-01-15",
      readTime: "5 min read",
    },
    {
      title: "Top 10 MCP Servers for 2024",
      excerpt: "Discover the best MCP servers to extend your AI capabilities",
      date: "2024-01-10",
      readTime: "8 min read",
    },
    {
      title: "Building Your First AI Agent",
      excerpt: "A comprehensive guide to creating autonomous AI agents",
      date: "2024-01-05",
      readTime: "12 min read",
    },
    {
      title: "Optimizing Cursor Rules for Better Code",
      excerpt: "Tips and tricks for writing effective Cursor rules",
      date: "2024-01-01",
      readTime: "6 min read",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-muted-foreground text-lg">
          Latest news, tutorials, and insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {posts.map((post) => (
          <Link key={post.title} href={`/blog/${post.title.toLowerCase().replace(/ /g, '-')}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
