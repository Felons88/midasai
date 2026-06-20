import { createClient } from "@/lib/supabase/server"
import { ShoppingBag, ExternalLink } from "lucide-react"
import Link from "next/link"

async function getPurchases() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: purchases, error } = await supabase
      .from('transactions')
      .select('id, amount, status, created_at, listing_id, listings(id, title, type)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching purchases:', error)
      return []
    }

    return purchases || []
  } catch (error) {
    console.error('Error in getPurchases:', error)
    return []
  }
}

export default async function PurchasesPage() {
  const purchases = await getPurchases()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Purchases</h1>
        <p className="text-white/50 text-sm">Everything you have purchased on MidasAI</p>
      </div>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <ShoppingBag className="h-12 w-12 text-white/20 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">No purchases yet</h2>
          <p className="text-sm text-white/40 mb-4">Browse the marketplace to find useful AI tools.</p>
          <Link
            href="/explore"
            className="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            Explore marketplace
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase: any) => (
            <Link
              key={purchase.id}
              href={`/listing/${purchase.listing_id}`}
              className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div>
                <h3 className="text-sm font-medium text-white">
                  {purchase.listings?.title || "Unknown item"}
                </h3>
                <p className="text-[11px] text-white/40 mt-0.5">
                  {purchase.listings?.type || "Item"} • {new Date(purchase.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-sm font-medium text-white">
                ${(purchase.amount / 100).toFixed(2)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
