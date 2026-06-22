import Link from "next/link"
import { Search, Sparkles, TrendingUp, Shield, Zap, Users, ArrowRight, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

async function getCategories() {
  try {
    const supabase = await createClient()
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }
    
    return categories || []
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
}

async function getCategoryCounts() {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select('type')
    
    if (error) {
      console.error('Error fetching category counts:', error)
      return { SKILL: 0, PLUGIN: 0, MCP: 0, AGENT: 0 }
    }
    
    const counts: Record<string, number> = {
      SKILL: 0,
      PLUGIN: 0,
      MCP: 0,
      AGENT: 0,
    }
    
    listings?.forEach((listing: any) => {
      if (listing.type in counts) {
        counts[listing.type]++
      }
    })
    
    return counts
  } catch (error) {
    console.error('Error in getCategoryCounts:', error)
    return { SKILL: 0, PLUGIN: 0, MCP: 0, AGENT: 0 }
  }
}

async function getFeaturedListings() {
  try {
    const supabase = await createClient()
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        reviews(rating)
      `)
      .eq('status', 'ACTIVE')
      .order('downloads', { ascending: false })
      .limit(3)
    
    if (error) {
      console.error('Error fetching featured listings:', error)
      return []
    }
    
    return listings || []
  } catch (error) {
    console.error('Error in getFeaturedListings:', error)
    return []
  }
}

async function getAverageRating(listingId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', listingId)
    
    if (error) {
      console.error('Error fetching rating:', error)
      return { rating: 0, count: 0 }
    }
    
    if (!data || data.length === 0) return { rating: 0, count: 0 }
    
    const totalRating = data.reduce((sum: number, r: any) => sum + r.rating, 0)
    return {
      rating: totalRating / data.length,
      count: data.length
    }
  } catch (error) {
    console.error('Error in getAverageRating:', error)
    return { rating: 0, count: 0 }
  }
}

export default async function HomePage() {
  const categories = await getCategories()
  const categoryCounts = await getCategoryCounts()
  const featuredListings = await getFeaturedListings()
  
  const listingsWithRatings = await Promise.all(
    featuredListings.map(async (listing: any) => {
      const ratingData = await getAverageRating(listing.id)
      return {
        ...listing,
        averageRating: ratingData.rating,
        reviewCount: ratingData.count
      }
    })
  )
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      {/* Hero Section */}
      <section className="relative py-32 md:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-cta" />
              <span className="text-sm font-medium text-text-primary">The Premier AI Marketplace</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 mt-8 bg-gradient-to-br from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Discover AI Tools That Transform Your Workflow
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              The premier marketplace for Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, and more.
            </p>
            <form action="/search" className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="search"
                  name="query"
                  aria-label="Search the marketplace"
                  placeholder="Search for skills, plugins, agents..."
                  className="w-full h-14 pl-12 pr-4 rounded-xl border bg-surface text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 text-base cursor-pointer">
                Search
              </Button>
            </form>
            <div className="flex gap-3 flex-wrap justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <span className="text-sm text-text-tertiary">Popular:</span>
              {["Claude Skills", "MCP Servers", "AI Agents", "Workflows"].map((tag) => (
                <Link
                  key={tag}
                  href={`/search?query=${encodeURIComponent(tag)}`}
                  className="text-sm text-cta hover:text-cta-light transition-colors font-medium cursor-pointer"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Bento Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Browse Categories</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Explore our curated collection of AI tools and resources
            </p>
          </div>
          <div className="bento-grid">
            {categories.map((category: any, index: number) => {
              const iconMap: Record<string, any> = {
                'Claude Skills': Sparkles,
                'Cursor Rules': Zap,
                'MCP Servers': TrendingUp,
                'AI Agents': Users,
              }
              const Icon = iconMap[category.name] || Sparkles
              const count = categoryCounts[category.name === 'Claude Skills' ? 'SKILL' : 
                            category.name === 'Cursor Rules' ? 'PLUGIN' :
                            category.name === 'MCP Servers' ? 'MCP' : 'AGENT'] || 0
              const gridClass = index === 0 ? 'bento-item-2' : 'bento-item-1'
              
              return (
                <Link key={category.id} href={`/${category.slug}`} className={gridClass}>
                  <Card className="glass h-full hover:shadow-glow transition-smooth group">
                    <CardHeader className="space-y-4">
                      <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center group-hover:bg-elevated transition-smooth">
                        <Icon className="h-7 w-7 text-cta" />
                      </div>
                      <CardTitle className="text-2xl text-text-primary">{category.name}</CardTitle>
                      <CardDescription className="text-base text-text-secondary">{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-tertiary">{count} listings</span>
                        <ArrowRight className="h-5 w-5 text-cta opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Featured Listings</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Hand-picked tools and resources by our team
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {listingsWithRatings.map((item: any, index: number) => (
              <Card key={item.id} className="glass hover:shadow-glow transition-smooth group" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="space-y-4">
                  <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                    ) : (
                      <span className="text-text-tertiary text-sm">Preview</span>
                    )}
                  </div>
                  <CardTitle className="text-2xl text-text-primary">{item.title}</CardTitle>
                  <CardDescription className="text-base text-text-secondary">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < Math.floor(item.averageRating) ? 'fill-cta text-cta' : 'text-text-tertiary'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-text-tertiary">{item.averageRating.toFixed(1)} ({item.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-text-primary">${item.price}</span>
                    <Button className="group-hover:shadow-glow transition-smooth" asChild>
                      <Link href={`/listing/${item.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Why Choose MidasAI</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Built for creators, by creators
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Verified Quality", description: "All listings are reviewed and verified by our team to ensure the highest quality standards" },
              { icon: Zap, title: "Instant Access", description: "Get immediate access to your purchased tools and resources with secure delivery" },
              { icon: Users, title: "Community Driven", description: "Join a thriving community of AI enthusiasts and creators sharing knowledge" },
            ].map((feature, index: number) => (
              <Card key={feature.title} className="glass hover:shadow-glow transition-smooth" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-cta" />
                  </div>
                  <CardTitle className="text-2xl text-text-primary">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-text-secondary leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-background" />
        <div className="spotlight" style={{ left: '20%', top: '30%' }} />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">Ready to Start Building?</h2>
          <p className="text-xl md:text-2xl mb-12 text-text-secondary max-w-2xl mx-auto">
            Join thousands of creators and developers on MidasAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-base shadow-glow" asChild>
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" asChild>
              <Link href="/creator/upload">List Your Item</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
