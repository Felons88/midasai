import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-cta" />
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Blog</h1>
            </div>
            <p className="text-xl text-text-secondary">
              Latest news, tutorials, and insights from the MidasAI team
            </p>
          </div>

          <Card className="glass text-center py-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardContent>
              <BookOpen className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-xl text-text-secondary mb-2">Blog coming soon</p>
              <p className="text-text-tertiary mb-6">We're working on great content about AI tools, workflows, and best practices.</p>
              <Button asChild>
                <Link href="/">Back to Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
