import Link from "next/link"
import { Search, Sparkles, TrendingUp, Shield, Zap, Users, ArrowRight, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Premier AI Marketplace</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Discover AI Tools That Transform Your Workflow
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              The premier marketplace for Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-3xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search for skills, plugins, agents..."
                  className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-input bg-background/50 backdrop-blur-xl text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                />
              </div>
              <Button size="lg" className="h-14 px-8 text-base">
                Search
              </Button>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {["Claude Skills", "MCP Servers", "AI Agents", "Workflows"].map((tag) => (
                <Link
                  key={tag}
                  href="/search"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Browse Categories</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our curated collection of AI tools and resources
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: "Claude Skills", href: "/skills", count: "250+", description: "Enhance Claude with custom skills" },
              { icon: Zap, title: "Cursor Rules", href: "/plugins", count: "180+", description: "Supercharge your Cursor IDE" },
              { icon: TrendingUp, title: "MCP Servers", href: "/mcp", count: "120+", description: "Model Context Protocol servers" },
              { icon: Users, title: "AI Agents", href: "/agents", count: "95+", description: "Autonomous AI agents" },
            ].map((category) => (
              <Link key={category.title} href={category.href}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-2 hover:border-primary/50 group">
                  <CardHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                    <CardDescription className="text-base">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{category.count} listings</span>
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Listings</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hand-picked tools and resources by our team
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Claude Skill Pack Pro", description: "50+ professional prompts for various use cases", price: "$29", rating: 4.8, reviews: 42 },
              { title: "MCP Server Bundle", description: "Complete set of MCP servers for data integration", price: "$49", rating: 4.9, reviews: 28 },
              { title: "AI Agent Toolkit", description: "Build autonomous agents with pre-built components", price: "$79", rating: 4.7, reviews: 35 },
            ].map((item, i) => (
              <Card key={i} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
                <CardHeader className="space-y-3">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Preview</span>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < Math.floor(item.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{item.rating} ({item.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{item.price}</span>
                    <Button className="group-hover:bg-primary/90 transition-colors">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose MidasAI</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for creators, by creators
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Verified Quality", description: "All listings are reviewed and verified by our team to ensure the highest quality standards" },
              { icon: Zap, title: "Instant Access", description: "Get immediate access to your purchased tools and resources with secure delivery" },
              { icon: Users, title: "Community Driven", description: "Join a thriving community of AI enthusiasts and creators sharing knowledge" },
            ].map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Building?</h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-2xl mx-auto">
            Join thousands of creators and developers on MidasAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-base" asChild>
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors" asChild>
              <Link href="/creator/upload">List Your Item</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
