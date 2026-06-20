import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Compass, TrendingUp, Zap, Star, Clock } from "lucide-react"

async function getExploreData() {
  try {
    const supabase = await createClient()
    
    const { data: trending } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, views, creator_id')
      .eq('status', 'ACTIVE')
      .order('views', { ascending: false })
      .limit(8)

    const { data: newest } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, creator_id')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(8)

    const { data: topRated } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, creator_id')
      .eq('status', 'ACTIVE')
      .order('downloads', { ascending: false })
      .limit(8)

    return { trending: trending || [], newest: newest || [], topRated: topRated || [] }
  } catch {
    return { trending: [], newest: [], topRated: [] }
  }
}

export default async function ExplorePage() {
  const data = await getExploreData()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Explore</h1>
        <p className="text-white/50 text-sm">Discover AI tools, skills, and automations</p>
      </div>

      {/* Trending */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Trending</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.trending.map((item: any) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded">
                  {item.type}
                </span>
              </div>
              <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors truncate">{item.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-white/30">
                <span>{item.downloads || 0} downloads</span>
                <span>${item.price}</span>
              </div>
            </Link>
          ))}
          {data.trending.length === 0 && (
            <p className="text-sm text-white/30 col-span-full">No trending items yet.</p>
          )}
        </div>
      </section>

      {/* Newest */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Newest</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.newest.map((item: any) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/40 bg-white/[0.06] px-2 py-0.5 rounded">
                  {item.type}
                </span>
              </div>
              <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors truncate">{item.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-white/30">
                <span>{item.downloads || 0} downloads</span>
                <span>${item.price}</span>
              </div>
            </Link>
          ))}
          {data.newest.length === 0 && (
            <p className="text-sm text-white/30 col-span-full">No items yet.</p>
          )}
        </div>
      </section>

      {/* Top Rated */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Most Downloaded</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.topRated.map((item: any) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/40 bg-white/[0.06] px-2 py-0.5 rounded">
                  {item.type}
                </span>
              </div>
              <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors truncate">{item.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-white/30">
                <span>{item.downloads || 0} downloads</span>
                <span>${item.price}</span>
              </div>
            </Link>
          ))}
          {data.topRated.length === 0 && (
            <p className="text-sm text-white/30 col-span-full">No items yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
