import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import {
  getAdminOverview,
  getRecentTransactions,
  getRevenueTrend,
  getTopListings,
  getSignupTrend,
  getAnalyticsEventCounts,
  getRecentActivity,
  formatBytes,
} from "@/lib/admin/queries"
import { AdminPageHeader, StatCard, TrendBars } from "@/components/admin/AdminUi"
import { RefundTransactionButton } from "@/components/admin/RefundTransactionButton"
import { StatusBadge } from "@/components/admin/AdminUi"
import { BarChart } from "@/components/analytics/BarChart"
import { ArrowRight, AlertTriangle } from "lucide-react"

export default async function AdminDashboardPage() {
  const adminPrefix = getAdminRoutePrefix()
  const [overview, revenueTrend, signups, eventCounts, recentTx, topListings, activity] = await Promise.all([
    getAdminOverview(),
    getRevenueTrend(14),
    getSignupTrend(14),
    getAnalyticsEventCounts(),
    getRecentTransactions(8),
    getTopListings(5),
    getRecentActivity(12),
  ])

  const revenueData = revenueTrend.map((d) => ({ date: d.date.slice(5), value: d.revenue }))
  const signupData = signups.map((d) => ({ date: d.date.slice(5), value: d.signups }))
  const eventData = Object.entries(eventCounts.eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, value]) => ({ label, value }))

  const attention = [
    { label: "Pending listings", href: `${adminPrefix}/listings`, value: overview.pendingListings, alert: overview.pendingListings > 0 },
    { label: "Open reports", href: `${adminPrefix}/moderation`, value: overview.openReports, alert: overview.openReports > 0 },
    { label: "Pending payouts", href: `${adminPrefix}/payouts`, value: overview.pendingPayouts, alert: overview.pendingPayouts > 0 },
    { label: "Refunded transactions", href: `${adminPrefix}/transactions`, value: overview.refundedCount, alert: overview.refundedCount > 0 },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Control center"
        description="Live platform metrics across users, commerce, content, and system"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard label="Total users" value={overview.totalUsers.toLocaleString()} sub={`+${overview.newUsers7d} this week`} />
        <StatCard label="Gross revenue" value={`$${overview.totalRevenue.toFixed(0)}`} accent sub={`$${overview.revenue30d.toFixed(0)} last 30d`} />
        <StatCard label="Completed sales" value={overview.completedSales} sub={`${overview.refundedCount} refunded`} />
        <StatCard label="Active listings" value={overview.activeListings} sub={`${overview.pendingListings} pending`} />
        <StatCard label="Subscriptions" value={overview.activeSubscriptions} sub={`~$${overview.mrrEstimate} MRR`} />
        <StatCard label="Downloads" value={overview.totalDownloads.toLocaleString()} sub={formatBytes(overview.storageBytes) + " storage"} />
        <StatCard label="Total assets" value={overview.totalAssets.toLocaleString()} sub="Files & uploads" />
        <StatCard label="30d events" value={eventCounts.pageViews30d.toLocaleString()} sub="Tracked actions" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue trend (14 days)</h2>
            <Link href={`${adminPrefix}/analytics`} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
              Full analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <TrendBars data={revenueData} />
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Needs attention
          </h2>
          <ul className="space-y-3 text-sm">
            {attention.map((item) => (
              <li key={item.label} className="flex justify-between items-center">
                <Link href={item.href} className="text-white/70 hover:text-white">{item.label}</Link>
                <span className={`font-medium ${item.alert ? "text-amber-400" : "text-white/60"}`}>{item.value}</span>
              </li>
            ))}
            <li className="flex justify-between items-center">
              <span className="text-white/70">Total payouts sent</span>
              <span className="text-white font-medium">${overview.totalPayouts.toFixed(0)}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Signups (14 days)</h2>
          <TrendBars data={signupData} valuePrefix="" />
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top events (30 days)</h2>
          <BarChart items={eventData} valuePrefix="" />
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <span className="text-xs text-white/40">Live events</span>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[280px] overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-sm text-white/40 p-4 text-center">No recent activity</p>
            ) : (
              activity.map((item, idx) => {
                const props = item.properties as Record<string, unknown> | null
                const listingId = props?.listing_id as string | undefined
                const target = listingId ? `/listing/${listingId}` : undefined
                return (
                  <div key={idx} className="px-4 py-2.5 text-sm hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium">{item.event}</span>
                      <span className="text-[10px] text-white/30">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : "—"}
                      </span>
                    </div>
                    {target ? (
                      <Link href={target} className="text-xs text-amber-400/70 hover:text-amber-400 truncate block">
                        {listingId}
                      </Link>
                    ) : (
                      <p className="text-xs text-white/30 truncate">{JSON.stringify(props).slice(0, 60)}</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Recent payments</h2>
            <Link href={`${adminPrefix}/transactions`} className="text-xs text-amber-400">View all</Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentTx.length === 0 ? (
              <p className="text-sm text-white/40 p-4 text-center">No transactions yet</p>
            ) : (
              recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-white truncate">
                      {(tx.listing as { title?: string } | null)?.title ?? "Purchase"}
                    </p>
                    <p className="text-xs text-white/40">
                      {(tx.user as { email?: string } | null)?.email ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={tx.status} />
                    <span className="text-amber-400 font-medium">${tx.amount}</span>
                    {tx.status === "COMPLETED" && (
                      <RefundTransactionButton transactionId={tx.id} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Top listings</h2>
            <Link href={`${adminPrefix}/listings`} className="text-xs text-amber-400">View all</Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topListings.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-white/[0.02]"
              >
                <span className="text-white truncate">{l.title}</span>
                <span className="text-white/40 shrink-0 ml-2">{l.downloads} dl</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
