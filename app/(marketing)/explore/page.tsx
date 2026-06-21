import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Compass, TrendingUp, Zap, Star, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingGrid } from "@/components/ui/loading"
import { Suspense } from "react"

async function getExploreData() {
  try {
    const supabase = await createClient()
    
    const { data: trending } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, views, creator_id, images, description')
      .eq('status', 'ACTIVE')
      .order('views', { ascending: false })
      .limit(8)

    const { data: newest } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, creator_id, images, description')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(8)

    const { data: topRated } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, creator_id, images, description')
      .eq('status', 'ACTIVE')
      .order('downloads', { ascending: false })
      .limit(8)

    return { trending: trending || [], newest: newest || [], topRated: topRated || [] }
  } catch {
    return { trending: [], newest: [], topRated: [] }
  }
}

export default async function ExplorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <Compass className="h-8 w-8 text-cta" />
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Explore</h1>
            </div>
            <p className="text-xl text-text-secondary">
              Discover trending, new, and top-rated AI tools
            </p>
          </div>

          <Suspense fallback={<LoadingGrid count={6} />}>
            <ExploreContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function ExploreContent() {
  const data = await getExploreData()

  return (
    <>
      {/* Trending */}
      <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-6 w-6 text-cta" />
          <h2 className="text-2xl font-semibold text-text-primary">Trending Now</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.trending.map((item: any, index: number) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Card className="glass hover:shadow-glow transition-smooth group h-full">
                <CardHeader className="space-y-3">
                  <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                    ) : (
                      <span className="text-text-tertiary text-sm">Preview</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-cta bg-cta/10 px-2 py-1 rounded">
                      {item.type}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-text-primary line-clamp-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">{item.downloads || 0} downloads</span>
                    <span className="text-text-primary font-bold">${item.price}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {data.trending.length === 0 && (
            <p className="text-text-tertiary col-span-full text-center py-8">No trending items yet.</p>
          )}
        </div>
      </section>

      {/* Newest */}
      <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-8">
          <Clock className="h-6 w-6 text-cta" />
          <h2 className="text-2xl font-semibold text-text-primary">Newest Arrivals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.newest.map((item: any, index: number) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Card className="glass hover:shadow-glow transition-smooth group h-full">
                <CardHeader className="space-y-3">
                  <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                    ) : (
                      <span className="text-text-tertiary text-sm">Preview</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary bg-surface px-2 py-1 rounded">
                      {item.type}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-text-primary line-clamp-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">{item.downloads || 0} downloads</span>
                    <span className="text-text-primary font-bold">${item.price}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {data.newest.length === 0 && (
            <p className="text-text-tertiary col-span-full text-center py-8">No items yet.</p>
          )}
        </div>
      </section>

      {/* Top Rated */}
      <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-8">
          <Star className="h-6 w-6 text-cta" />
          <h2 className="text-2xl font-semibold text-text-primary">Most Downloaded</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.topRated.map((item: any, index: number) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Card className="glass hover:shadow-glow transition-smooth group h-full">
                <CardHeader className="space-y-3">
                  <div className="aspect-video bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-smooth" />
                    ) : (
                      <span className="text-text-tertiary text-sm">Preview</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary bg-surface px-2 py-1 rounded">
                      {item.type}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-text-primary line-clamp-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">{item.downloads || 0} downloads</span>
                    <span className="text-text-primary font-bold">${item.price}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {data.topRated.length === 0 && (
            <p className="text-text-tertiary col-span-full text-center py-8">No items yet.</p>
          )}
        </div>
      </section>
    </>
  )
}
