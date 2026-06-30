import Link from "next/link"
import {
  Sparkles, TrendingUp, Zap, Users, ArrowRight, Download,
  Code2, Bot, Cpu, Globe, Database, Shield, Layers, FileText,
  Wrench, BarChart3, Workflow, BookOpen, Palette, Video, Mic, Megaphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import HeroSearchBox from "@/components/marketplace/HeroSearchBox"
import { createPublicClient } from "@/lib/supabase/server"

const CATEGORY_ICONS: Record<string, any> = {
  "claude-skills": Sparkles,
  "ai-agents": Bot,
  "mcp-servers": Cpu,
  "cursor-rules": Code2,
  "windsurf-workflows": Workflow,
  "coding": Code2,
  "productivity": Zap,
  "automation": Layers,
  "automations": Layers,
  "developer-tools": Wrench,
  "devops": Globe,
  "databases": Database,
  "security": Shield,
  "research": BookOpen,
  "documentation": FileText,
  "marketing": Megaphone,
  "design": Palette,
  "writing": FileText,
  "image-generation": Palette,
  "video-creation": Video,
  "voice": Mic,
  "finance": BarChart3,
  "education": BookOpen,
  "web-scraping": Globe,
  "browser-automation": Globe,
  "plugins": Layers,
  "prompt-packs": Sparkles,
  "templates": FileText,
  "api": Code2,
  "cloud": Globe,
  "github-copilot": Code2,
}

const TOP_CATEGORIES = [
  { slug: "claude-skills", label: "Claude Skills", sub: ["frontend-design", "skill-creator", "browser-use", "docx"] },
  { slug: "coding", label: "Development", sub: ["Architecture Patterns", "Backend", "Frontend", "Mobile"] },
  { slug: "ai-agents", label: "AI Agents", sub: ["LLM & AI", "Machine Learning", "Data Analysis"] },
  { slug: "productivity", label: "Productivity", sub: ["Automation Tools", "IDE Plugins", "CLI Tools"] },
  { slug: "devops", label: "DevOps", sub: ["Git Workflows", "CI/CD", "Cloud", "Containers"] },
  { slug: "security", label: "Testing & Security", sub: ["Code Quality", "Testing", "Security"] },
  { slug: "documentation", label: "Documentation", sub: ["Knowledge Base", "Technical Docs", "Education"] },
  { slug: "marketing", label: "Business", sub: ["Sales & Marketing", "Project Management", "Finance"] },
]

async function getHomePageData() {
  try {
    const supabase = createPublicClient()
    const [listingsResult, categoriesResult] = await Promise.all([
      supabase
        .from("listings")
        .select("id, title, description, short_description, type, downloads, images, tags, updated_at, creator:users!listings_creator_id_fkey(name, avatar_url)")
        .eq("status", "ACTIVE")
        .order("downloads", { ascending: false })
        .limit(20),
      supabase
        .from("categories")
        .select("id, name, slug")
        .order("name"),
    ])

    const countResult = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE")

    return {
      topListings: listingsResult.data ?? [],
      categories: categoriesResult.data ?? [],
      totalListings: countResult.count ?? 0,
    }
  } catch {
    return { topListings: [], categories: [], totalListings: 0 }
  }
}

export const revalidate = 60

export default async function HomePage() {
  const { topListings, categories, totalListings } = await getHomePageData()

  const categoryMap = Object.fromEntries(
    (categories as { id: string; name: string; slug: string }[]).map((c) => [c.slug, c])
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      {/* Hero */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-white/10 mb-6 animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5 text-cta" />
              <span className="text-xs font-medium text-text-secondary">
                {totalListings.toLocaleString()}+ Agent Skills — compatible with Claude Code, Codex CLI &amp; more
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-5 text-text-primary animate-fade-in-up leading-tight" style={{ animationDelay: "0.05s" }}>
              Agent Skills Marketplace
            </h1>
            <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Browse, install and share AI agent skills for Claude, Cursor, Windsurf, Codex and more.
            </p>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <HeroSearchBox />
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {["Claude Skills", "MCP Servers", "Browser Automation", "AI Agents", "Cursor Rules", "Windsurf Workflows"].map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="text-xs px-3 py-1 rounded-full bg-surface border border-white/10 text-text-secondary hover:text-cta hover:border-cta/30 transition-smooth"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-surface/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cta" />
              <span><strong className="text-text-primary">{totalListings.toLocaleString()}</strong> Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cta" />
              <span><strong className="text-text-primary">500+</strong> Creators</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-cta" />
              <span><strong className="text-text-primary">1M+</strong> Installs</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cta" />
              <span>Compatible with <strong className="text-text-primary">Claude Code, Codex, ChatGPT</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Skill List + Categories */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto">

            {/* Left: Browse Skills List */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Browse Agent Skills</h2>
                <Link href="/explore" className="text-sm text-cta hover:text-cta-light flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-white/5">
                {topListings.map((item: any) => {
                  const creator = item.creator
                  return (
                    <Link
                      key={item.id}
                      href={`/listing/${item.id}`}
                      className="flex items-start gap-4 py-4 group hover:bg-white/3 -mx-3 px-3 rounded-lg transition-smooth"
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface flex-shrink-0 border border-white/10 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-cta/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-text-primary group-hover:text-cta transition-smooth line-clamp-1">
                              {item.title}
                            </span>
                            {creator?.name && (
                              <span className="text-xs text-text-tertiary ml-2">{creator.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-text-tertiary flex-shrink-0">
                            <Download className="h-3 w-3" />
                            {(item.downloads ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                          {item.short_description || item.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/explore">Explore All {totalListings.toLocaleString()} Skills</Link>
                </Button>
              </div>
            </div>

            {/* Right: Category Browser */}
            <div className="lg:w-72 flex-shrink-0">
              <h2 className="text-xl font-semibold text-text-primary mb-6">Browse by Category</h2>

              <div className="space-y-4">
                {TOP_CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] ?? Sparkles
                  const catData = categoryMap[cat.slug]
                  return (
                    <div key={cat.slug} className="glass rounded-xl p-4">
                      <Link
                        href={`/explore?category=${cat.slug}`}
                        className="flex items-center gap-3 mb-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-cta" />
                        </div>
                        <span className="font-medium text-text-primary group-hover:text-cta transition-smooth text-sm">
                          {cat.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-text-tertiary ml-auto opacity-0 group-hover:opacity-100 transition-smooth" />
                      </Link>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.sub.map((sub) => (
                          <Link
                            key={sub}
                            href={`/search?q=${encodeURIComponent(sub)}`}
                            className="text-xs px-2 py-0.5 rounded-full bg-surface/60 text-text-tertiary hover:text-text-primary hover:bg-surface transition-smooth border border-white/5"
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}

                <Link
                  href="/explore"
                  className="block text-center text-sm text-cta hover:text-cta-light py-2"
                >
                  View All Categories →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-white/5 py-12 bg-surface/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">Share Your Skills with the Community</h2>
          <p className="text-text-secondary mb-6 max-w-xl mx-auto text-sm">
            Publish your Claude skills, MCP servers, Cursor rules, and more on MidasAI. Reach thousands of AI developers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="shadow-glow" asChild>
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/creator/upload">Upload a Skill</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
