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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Categories</h1>
        <p className="text-muted-foreground text-lg">
          Browse AI tools by category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link key={category.name} href={category.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <category.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-muted-foreground">{category.count} listings</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
