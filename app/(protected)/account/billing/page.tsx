import { createClient } from "@/lib/supabase/server"
import { getBillingContext } from "@/lib/billing/entitlements"
import { SUBSCRIPTION_TIERS } from "@/lib/monetization"
import Link from "next/link"
import { CreditCard } from "lucide-react"
import { UpgradeButton } from "@/components/billing/UpgradeButton"

function UsageBar({
  label,
  used,
  max,
}: {
  label: string
  used: number
  max: number
}) {
  const unlimited = max === -1
  const pct = unlimited ? 0 : max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80">
          {used}
          {unlimited ? " / ∞" : ` / ${max}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-400" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-white/10 text-white/70",
  PRO: "bg-amber-400/10 text-amber-400",
  ENTERPRISE: "bg-purple-400/10 text-purple-400",
}

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const billing = await getBillingContext(supabase, user.id)
  const { limits, usage } = billing

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .in("status", ["ACTIVE", "TRIALING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const tierInfo = SUBSCRIPTION_TIERS.find((t) => t.tier === limits.tier)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Billing</h1>
        <p className="text-white/50 text-sm">Plan limits, usage, and subscription</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Current Plan</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${TIER_COLORS[limits.tier] ?? TIER_COLORS.FREE}`}
            >
              {limits.tier}
            </span>
          </div>

          {subscription && (
            <p className="text-xs text-white/40 mb-3">
              Status: {subscription.status}
              {subscription.current_period_end &&
                ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              {subscription.cancel_at_period_end && " · Cancels at period end"}
            </p>
          )}

          <p className="text-sm text-white/50 mb-4">
            {tierInfo?.features.slice(0, 3).join(" · ") ?? "Browse and download from the marketplace."}
          </p>

          {limits.tier === "FREE" && (
            <UpgradeButton tier="PRO" label="Upgrade to Pro" />
          )}
          {limits.tier === "PRO" && (
            <UpgradeButton tier="ENTERPRISE" label="Upgrade to Enterprise" variant="outline" />
          )}
        </div>

        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <h2 className="text-lg font-semibold text-white">Usage this period</h2>
          <UsageBar label="Downloads (month)" used={usage.downloadsThisMonth} max={limits.maxDownloadsPerMonth} />
          <UsageBar label="Listings" used={usage.listings} max={limits.maxListings} />
          <UsageBar label="API keys" used={usage.apiKeys} max={limits.maxApiKeys} />
          <UsageBar label="Webhooks" used={usage.webhooks} max={limits.maxWebhooks} />
          <UsageBar label="MCP connections" used={usage.mcpServers} max={limits.maxMcpServers} />
        </div>

        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Payment Methods</h2>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06]">
            <CreditCard className="h-5 w-5 text-white/30" />
            <p className="text-sm text-white/50">
              Purchases use Stripe Checkout. Subscription billing coming soon.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Invoices</h2>
          <p className="text-sm text-white/30">
            Purchase receipts are emailed by Stripe after checkout.
          </p>
        </div>
      </div>
    </div>
  )
}
