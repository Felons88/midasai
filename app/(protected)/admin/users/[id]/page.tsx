import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminUserDetail, getAdminUserAuditLogs } from "@/lib/admin/queries"
import { AdminPageHeader, StatusBadge } from "@/components/admin/AdminUi"
import { UserRoleEditor } from "@/components/admin/UserRoleEditor"
import { UserStatusBadge } from "@/components/admin/UserStatusBadge"
import { UserBanButton } from "@/components/admin/UserBanButton"
import { UserNotifyButton } from "@/components/admin/UserNotifyButton"
import { notFound } from "next/navigation"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getAdminUserDetail(id)
  if (!data.user) notFound()
  const auditLogs = await getAdminUserAuditLogs(id)

  const adminPrefix = getAdminRoutePrefix()
  const user = data.user

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.name || user.email || "User"}
        description={user.email ?? undefined}
      >
        <div className="flex items-center gap-2">
          <UserNotifyButton userId={user.id} />
          <UserBanButton userId={user.id} status={user.status} />
          <UserRoleEditor userId={user.id} currentRole={user.role ?? "USER"} />
        </div>
      </AdminPageHeader>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Status</p>
          <div className="mt-1">
            <UserStatusBadge status={user.status} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Role</p>
          <p className="text-white font-medium mt-1">{user.role}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Joined</p>
          <p className="text-white font-medium mt-1">
            {user.created_at ? new Date(user.created_at).toLocaleString() : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Last active</p>
          <p className="text-white font-medium mt-1">
            {user.last_active_at ? new Date(user.last_active_at).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Plan tier</p>
          <p className="text-white font-medium mt-1">{data.entitlements?.tier ?? "FREE"}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Listings</p>
          <p className="text-white font-medium mt-1">{data.listings.length}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs text-white/40">Purchases</p>
          <p className="text-white font-medium mt-1">{data.transactions.length}</p>
        </div>
      </div>

      {data.creatorAccount && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Stripe Connect</h2>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Payouts enabled</p>
              <p className="text-white">{data.creatorAccount.payouts_enabled ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Available balance</p>
              <p className="text-white">${data.creatorAccount.available_balance ?? 0}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Lifetime revenue</p>
              <p className="text-white">${data.creatorAccount.lifetime_revenue ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Subscriptions</h2>
        {data.subscriptions.length === 0 ? (
          <p className="text-sm text-white/40">No subscriptions</p>
        ) : (
          <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.04]">
            {data.subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-white">{sub.tier}</span>
                <StatusBadge status={sub.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Listings</h2>
        <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.04]">
          {data.listings.length === 0 ? (
            <p className="text-sm text-white/40 p-4">No listings</p>
          ) : (
            data.listings.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-white/[0.02]"
              >
                <span className="text-white">{l.title}</span>
                <StatusBadge status={l.status} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Recent purchases</h2>
        <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.04]">
          {data.transactions.length === 0 ? (
            <p className="text-sm text-white/40 p-4">No purchases</p>
          ) : (
            data.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-white">
                  {(tx.listing as { title?: string } | null)?.title ?? "Purchase"}
                </span>
                <span className="text-amber-400">${tx.amount}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Admin audit log</h2>
        <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.04]">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-white/40 p-4">No admin actions recorded</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between px-4 py-3 text-sm gap-4">
                <div>
                  <p className="text-white">{log.action}</p>
                  <p className="text-xs text-white/40">
                    {log.user && typeof log.user === "object" && "name" in log.user
                      ? (log.user as { name?: string | null }).name ?? "Unknown"
                      : "Unknown"}
                  </p>
                </div>
                <span className="text-white/40 text-xs shrink-0">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <Link href={`${adminPrefix}/users`} className="text-sm text-amber-400 hover:underline">
        ← Back to users
      </Link>
    </div>
  )
}
