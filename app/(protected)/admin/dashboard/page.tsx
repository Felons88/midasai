import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import {
  getAdminOverview,
  getRecentTransactions,
  getRevenueTrend,
  getTopListings,
  formatBytes,
} from "@/lib/admin/queries"
import { AdminPageHeader, StatCard, TrendBars } from "@/components/admin/AdminUi"
import { RefundTransactionButton } from "@/components/admin/RefundTransactionButton"
import { StatusBadge } from "@/components/admin/AdminUi"
import { ArrowRight } from "lucide-react"

export default async function AdminDashboardPage() {
  const adminPrefix = getAdminRoutePrefix()
  const [overview, revenueTrend, recentTx, topListings] = await Promise.all([
    getAdminOverview(),
    getRevenueTrend(14),
    getRecentTransactions(8),
    getTopListings(5),
  ])

  const trendData = revenueTrend.map((d) => ({ date: d.date.slice(5), value: d.revenue }))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform overview"
        description="Live metrics across users, commerce, and content"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="Total users" value={overview.totalUsers.toLocaleString()} sub={`+${overview.newUsers7d} this week`} />
        <StatCard label="Gross revenue" value={`$${overview.totalRevenue.toFixed(0)}`} accent sub={`$${overview.revenue30d.toFixed(0)} last 30d`} />
        <StatCard label="Completed sales" value={overview.completedSales} sub={`${overview.refundedCount} refunded`} />
        <StatCard label="Active listings" value={overview.activeListings} sub={`${overview.pendingListings} pending review`} />
        <StatCard label="Subscriptions" value={overview.activeSubscriptions} sub={`~$${overview.mrrEstimate} MRR est.`} />
        <StatCard label="Downloads" value={overview.totalDownloads.toLocaleString()} sub={formatBytes(overview.storageBytes) + " storage"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue (14 days)</h2>
            <Link href={`${adminPrefix}/analytics`} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
              Full analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <TrendBars data={trendData} />
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Needs attention</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <Link href={`${adminPrefix}/listings`} className="text-white/70 hover:text-white">Pending listings</Link>
              <span className="text-amber-400 font-medium">{overview.pendingListings}</span>
            </li>
            <li className="flex justify-between">
              <Link href={`${adminPrefix}/moderation`} className="text-white/70 hover:text-white">Open reports</Link>
              <span className="text-amber-400 font-medium">{overview.openReports}</span>
            </li>
            <li className="flex justify-between">
              <Link href={`${adminPrefix}/payouts`} className="text-white/70 hover:text-white">Pending payouts</Link>
              <span className="text-amber-400 font-medium">{overview.pendingPayouts}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-white/70">Total payouts sent</span>
              <span className="text-white font-medium">${overview.totalPayouts.toFixed(0)}</span>
            </li>
          </ul>
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
