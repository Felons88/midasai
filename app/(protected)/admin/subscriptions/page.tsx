import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminSubscriptions } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/AdminUi"

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAdminSubscriptions(200)
  const adminPrefix = getAdminRoutePrefix()

  return (
    <div>
      <AdminPageHeader
        title="Subscriptions"
        description="Customer billing plans synced from Stripe"
      />

      <AdminTable headers={["Customer", "Tier", "Status", "Period", "Stripe", ""]}>
        {subscriptions.map((sub) => {
          const user = sub.user as { id?: string; name?: string; email?: string } | null
          return (
            <tr key={sub.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                {user?.id ? (
                  <Link href={`${adminPrefix}/users/${user.id}`} className="hover:text-amber-400">
                    <p className="text-white text-sm">{user.name || "—"}</p>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </Link>
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-white font-medium">{sub.tier}</td>
              <td className="px-4 py-3">
                <StatusBadge status={sub.status} />
                {sub.cancel_at_period_end && (
                  <span className="ml-1 text-[10px] text-white/40">cancels end</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-white/50">
                {sub.current_period_start && sub.current_period_end
                  ? `${new Date(sub.current_period_start).toLocaleDateString()} – ${new Date(sub.current_period_end).toLocaleDateString()}`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-white/30 font-mono truncate max-w-[140px]">
                {sub.stripe_subscription_id ?? "—"}
              </td>
              <td className="px-4 py-3" />
            </tr>
          )
        })}
      </AdminTable>
    </div>
  )
}
