import { createClient } from "@/lib/supabase/server"
import { CreditPackCard } from "@/components/billing/CreditPackCard"

export default async function CreditPacksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: creditPacks } = await supabase
    .from("credit_packs")
    .select("*")
    .eq("is_active", true)
    .order("credits", { ascending: true })

  const packs = (creditPacks || []).map((pack) => ({
    ...pack,
    isPopular: (pack.metadata as any)?.popular === true,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Credit Packs</h1>
        <p className="text-sm text-white/40">Purchase credit packs to power your AI features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <CreditPackCard
            key={pack.id}
            pack={pack}
            onPurchase={async (packId) => {
              const res = await fetch("/api/billing/credit-packs/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId }),
              })
              const data = await res.json()
              if (data.url) {
                window.location.href = data.url
              } else {
                alert(data.error || "Purchase failed")
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
