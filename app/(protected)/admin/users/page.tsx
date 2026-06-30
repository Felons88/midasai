import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminUsers } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable } from "@/components/admin/AdminUi"
import { UserRoleEditor } from "@/components/admin/UserRoleEditor"

export default async function AdminUsersPage() {
  const users = await getAdminUsers(200)
  const adminPrefix = getAdminRoutePrefix()

  return (
    <div>
      <AdminPageHeader title="Users" description={`${users.length} users loaded`} />
      <AdminTable headers={["User", "Role", "Joined", "Actions"]}>
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <Link href={`${adminPrefix}/users/${user.id}`} className="hover:text-amber-400">
                <p className="font-medium text-white">{user.name || "Unnamed"}</p>
                <p className="text-xs text-white/40">{user.email}</p>
              </Link>
            </td>
            <td className="px-4 py-3">
              <UserRoleEditor userId={user.id} currentRole={user.role ?? "USER"} />
            </td>
            <td className="px-4 py-3 text-white/50 text-xs">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </td>
            <td className="px-4 py-3">
              <Link
                href={`${adminPrefix}/users/${user.id}`}
                className="text-xs text-amber-400 hover:underline"
              >
                View profile
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  )
}
