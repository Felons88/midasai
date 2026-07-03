import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminUsers } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { Check, X } from "lucide-react"

const ROLES = [
  { id: "USER", label: "User", description: "Can browse, purchase, bookmark, and follow creators." },
  { id: "CREATOR", label: "Creator", description: "Can publish listings, view creator analytics, and receive payouts." },
  { id: "MODERATOR", label: "Moderator", description: "Can review reports, manage content flags, and view moderation queue." },
  { id: "ADMIN", label: "Admin", description: "Full platform management except owner-level configuration." },
  { id: "OWNER", label: "Owner", description: "Unrestricted access to every admin panel section and configuration." },
]

const PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "users", label: "Users", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "creators", label: "Creators", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "listings", label: "Listings", user: false, creator: false, moderator: true, admin: true, owner: true },
  { id: "moderation", label: "Moderation", user: false, creator: false, moderator: true, admin: true, owner: true },
  { id: "transactions", label: "Payments", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "subscriptions", label: "Subscriptions", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "payouts", label: "Payouts", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "announcements", label: "Announcements", user: false, creator: false, moderator: false, admin: true, owner: true },
  { id: "system", label: "System / Settings", user: false, creator: false, moderator: false, admin: false, owner: true },
]

export default async function AdminRolesPage() {
  const adminPrefix = getAdminRoutePrefix()
  const { count: userCount } = await getAdminUsers({ pageSize: 1 })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Roles & permissions"
        description={`${userCount.toLocaleString()} total accounts across ${ROLES.length} roles`}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {ROLES.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                {role.id}
              </span>
            </div>
            <p className="text-white font-medium">{role.label}</p>
            <p className="text-sm text-white/40 mt-1">{role.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wide">Section</th>
                {ROLES.map((role) => (
                  <th
                    key={role.id}
                    className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wide min-w-[80px]"
                  >
                    {role.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {PERMISSIONS.map((perm) => (
                <tr key={perm.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{perm.label}</td>
                  {ROLES.map((role) => {
                    const hasAccess = perm[role.id.toLowerCase() as keyof typeof perm] === true
                    return (
                      <td key={role.id} className="px-4 py-3 text-center">
                        {hasAccess ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-white/20 mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-white/40">
        Change a user&apos;s role from the{" "}
        <Link href={`${adminPrefix}/users`} className="text-amber-400 hover:underline">
          Users
        </Link>{" "}
        page.
      </p>
    </div>
  )
}
