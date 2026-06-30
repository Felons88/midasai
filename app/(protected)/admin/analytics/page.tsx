import {
  getAdminOverview,
  getRevenueTrend,
  getSignupTrend,
  getAnalyticsEventCounts,
  getBillingEvents,
  getTopListings,
} from "@/lib/admin/queries"
import { AdminPageHeader, StatCard, TrendBars } from "@/components/admin/AdminUi"

export default async function AdminAnalyticsPage() {
  const [overview, revenue30, signups30, analytics, billingEvents, topListings] =
    await Promise.all([
      getAdminOverview(),
      getRevenueTrend(30),
      getSignupTrend(30),
      getAnalyticsEventCounts(),
      getBillingEvents(30),
      getTopListings(10),
    ])

  const revenueBars = revenue30.map((d) => ({ date: d.date.slice(5), value: d.revenue }))
  const signupBars = signups30.map((d) => ({ date: d.date.slice(5), value: d.signups }))

  const eventEntries = Object.entries(analytics.eventCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Platform growth, revenue, and product events (last 30 days)"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Revenue (30d)" value={`$${overview.revenue30d.toFixed(0)}`} accent />
        <StatCard label="New users (7d)" value={overview.newUsers7d} />
        <StatCard label="Page views (30d)" value={analytics.pageViews30d.toLocaleString()} />
        <StatCard label="Est. MRR" value={`$${overview.mrrEstimate}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue trend</h2>
          <TrendBars data={revenueBars} />
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Signups trend</h2>
          <TrendBars data={signupBars} valuePrefix="" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Product events</h2>
          {eventEntries.length === 0 ? (
            <p className="text-sm text-white/40">No events recorded yet</p>
          ) : (
            <ul className="space-y-2">
              {eventEntries.map(([event, count]) => (
                <li key={event} className="flex justify-between text-sm">
                  <span className="text-white/70 font-mono text-xs">{event}</span>
                  <span className="text-white font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top listings by downloads</h2>
          <ul className="space-y-2">
            {topListings.map((l) => (
              <li key={l.id} className="flex justify-between text-sm">
                <span className="text-white/80 truncate mr-2">{l.title}</span>
                <span className="text-white/40 shrink-0">{l.downloads} dl</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Recent billing events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-white/40 border-b border-white/[0.06]">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">User</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {billingEvents.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 pr-4 text-white/50 text-xs">
                    {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-4 text-white/80">
                    {(e.user as { email?: string } | null)?.email ?? "—"}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-white/60">{e.event_type}</td>
                  <td className="py-2 text-amber-400">
                    {e.amount != null ? `$${e.amount}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
