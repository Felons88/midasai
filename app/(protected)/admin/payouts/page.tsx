import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminPayouts, getCreatorAccounts } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/AdminUi"

export default async function AdminPayoutsPage() {
  const [payouts, connectAccounts] = await Promise.all([
    getAdminPayouts(200),
    getCreatorAccounts(100),
  ])
  const adminPrefix = getAdminRoutePrefix()

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Payouts & creator accounts"
        description="Creator earnings, Stripe Connect status, and payout history"
      />

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Stripe Connect accounts</h2>
        <AdminTable headers={["Creator", "Payouts", "Charges", "Balance", "Lifetime"]}>
          {connectAccounts.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-white/40 text-sm">
                No Connect accounts yet
              </td>
            </tr>
          ) : (
            connectAccounts.map((acct) => {
              const user = acct.user as { id?: string; name?: string; email?: string } | null
              return (
                <tr key={acct.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    {user?.id ? (
                      <Link href={`${adminPrefix}/users/${user.id}`} className="text-sm text-white hover:text-amber-400">
                        {user.name || user.email}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{acct.payouts_enabled ? "✓" : "✗"}</td>
                  <td className="px-4 py-3 text-sm">{acct.charges_enabled ? "✓" : "✗"}</td>
                  <td className="px-4 py-3 text-amber-400">${acct.available_balance ?? 0}</td>
                  <td className="px-4 py-3 text-white/70">${acct.lifetime_revenue ?? 0}</td>
                </tr>
              )
            })
          )}
        </AdminTable>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Payout history</h2>
        <AdminTable headers={["Date", "Creator", "Amount", "Status", "Stripe ID"]}>
          {payouts.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-white/40 text-sm">
                No payouts recorded
              </td>
            </tr>
          ) : (
            payouts.map((p) => {
              const user = p.user as { name?: string; email?: string } | null
              return (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs text-white/50">
                    {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">
                    {user?.name || user?.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-amber-400 font-medium">
                    ${p.amount} {p.currency?.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status?.toUpperCase() ?? null} />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-white/30 truncate max-w-[140px]">
                    {p.stripe_payout_id ?? "—"}
                  </td>
                </tr>
              )
            })
          )}
        </AdminTable>
      </section>
    </div>
  )
}
