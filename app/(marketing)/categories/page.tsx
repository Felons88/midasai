import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getCategoriesWithCounts() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }
    
    // Get counts per type
    const { data: listings } = await supabase
      .from('listings')
      .select('type')
      .eq('status', 'ACTIVE')
    
    const typeCounts: Record<string, number> = {}
    listings?.forEach((l: any) => {
      typeCounts[l.type] = (typeCounts[l.type] || 0) + 1
    })
    
    // Map categories to their listing type counts
    const typeMap: Record<string, string> = {
      'claude-skills': 'SKILL',
      'cursor-rules': 'PLUGIN',
      'mcp-servers': 'MCP',
      'ai-agents': 'AGENT',
      'prompt-packs': 'PROMPT',
      'windsurf-workflows': 'WORKFLOW',
      'templates': 'TEMPLATE',
      'automations': 'AUTOMATION',
      'developer-tools': 'DEVELOPER_TOOL',
      'plugins': 'PLUGIN',
    }
    
    const slugToRoute: Record<string, string> = {
      'claude-skills': '/skills',
      'cursor-rules': '/plugins',
      'mcp-servers': '/mcp',
      'ai-agents': '/agents',
      'prompt-packs': '/prompts',
      'windsurf-workflows': '/workflows',
      'templates': '/templates',
      'automations': '/workflows',
      'developer-tools': '/skills',
      'github-copilot': '/plugins',
      'plugins': '/plugins',
      'documentation': '/templates',
    }
    
    return (categories || []).map((cat: any) => ({
      ...cat,
      count: typeCounts[typeMap[cat.slug] || ''] || 0,
      href: slugToRoute[cat.slug] || `/categories/${cat.slug}`,
    }))
  } catch (error) {
    console.error('Error in getCategoriesWithCounts:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts()

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
          {categories.map((category: any, index: number) => (
            <Link key={category.id} href={category.href} className="bento-item-1">
              <Card className="glass hover:shadow-glow transition-smooth group h-full" style={{ animationDelay: `${index * 0.05}s` }}>
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center group-hover:bg-elevated transition-smooth">
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-text-primary">{category.name}</h3>
                  <p className="text-text-secondary text-sm">{category.description}</p>
                  <p className="text-text-tertiary">{category.count} listings</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {categories.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl text-text-secondary">No categories found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
