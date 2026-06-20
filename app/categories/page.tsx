import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Zap, TrendingUp, Users, FileText, Workflow, Layers, Bot } from "lucide-react"
import Link from "next/link"

export default function CategoriesPage() {
  const categories = [
    { icon: Sparkles, name: "Claude Skills", count: 250, href: "/skills" },
    { icon: Zap, name: "Cursor Rules", count: 180, href: "/plugins" },
    { icon: TrendingUp, name: "MCP Servers", count: 120, href: "/mcp" },
    { icon: Users, name: "AI Agents", count: 95, href: "/agents" },
    { icon: FileText, name: "Prompt Packs", count: 320, href: "/prompts" },
    { icon: Workflow, name: "Workflows", count: 150, href: "/workflows" },
    { icon: Layers, name: "Templates", count: 200, href: "/templates" },
    { icon: Bot, name: "Automations", count: 75, href: "/automations" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Categories</h1>
          <p className="text-xl text-text-secondary">
            Browse AI tools by category
          </p>
        </div>

        <div className="bento-grid animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {categories.map((category, index) => (
            <Link key={category.name} href={category.href} className="bento-item-1">
              <Card className="glass hover:shadow-glow transition-smooth group h-full" style={{ animationDelay: `${index * 0.05}s` }}>
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center group-hover:bg-elevated transition-smooth">
                    <category.icon className="h-8 w-8 text-cta" />
                  </div>
                  <h3 className="text-2xl font-semibold text-text-primary">{category.name}</h3>
                  <p className="text-text-tertiary">{category.count} listings</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
