import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Download, ExternalLink, Package } from "lucide-react"

async function getDownloads(userId: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('downloads')
      .select(`
        id, created_at, listing_id,
        listings(id, title, type, price, description)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    return data || []
  } catch {
    return []
  }
}

export default async function DownloadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const downloads = await getDownloads(user.id)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Downloads</h1>
        <p className="text-white/50 text-sm">Your downloaded assets and purchase history</p>
      </div>

      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Download className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/50 mb-2">No downloads yet</p>
          <p className="text-white/30 text-sm mb-6">Browse the marketplace to find great tools</p>
          <Link href="/explore" className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors">
            Explore Assets
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map((dl: any) => (
            <div key={dl.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{dl.listings?.title || 'Unknown Asset'}</p>
                <div className="flex items-center gap-3 text-[11px] text-white/30 mt-0.5">
                  <span>{dl.listings?.type}</span>
                  <span>Downloaded {new Date(dl.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Link
                href={`/listing/${dl.listing_id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
