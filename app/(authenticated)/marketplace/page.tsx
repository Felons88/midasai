import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Store, Filter, Search } from "lucide-react"

async function getMarketplaceData() {
  try {
    const supabase = await createClient()
    
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, type, price, downloads, views, description, creator_id, created_at')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(24)

    return listings || []
  } catch {
    return []
  }
}

export default async function MarketplacePage() {
  const listings = await getMarketplaceData()

  const types = ['ALL', 'SKILL', 'CURSOR_RULE', 'MCP_SERVER', 'AGENT', 'PROMPT_PACK', 'WORKFLOW', 'TEMPLATE', 'PLUGIN']

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Marketplace</h1>
          <p className="text-white/50 text-sm">Browse and purchase AI tools, skills, and automations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {types.map(type => (
          <button
            key={type}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {type === 'ALL' ? 'All' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing: any) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.id}`}
            className="group p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded">
                {listing.type}
              </span>
              {listing.price === 0 && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-green-400/80 bg-green-400/10 px-2 py-0.5 rounded">
                  Free
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors mb-1.5 truncate">
              {listing.title}
            </h3>
            <p className="text-[12px] text-white/30 line-clamp-2 mb-3">
              {listing.description || 'No description'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-white/30">
              <span>{listing.downloads || 0} downloads</span>
              <span className="font-semibold text-white">{listing.price > 0 ? `$${listing.price}` : 'Free'}</span>
            </div>
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Store className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/50 mb-2">No listings yet</p>
          <p className="text-white/30 text-sm">Be the first to publish an asset</p>
        </div>
      )}
    </div>
  )
}
