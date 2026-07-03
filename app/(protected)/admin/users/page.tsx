import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminUsers } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"
import { UserRoleEditor } from "@/components/admin/UserRoleEditor"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default async function AdminUsersPage() {
  const users = await getAdminUsers(1000)
  const adminPrefix = getAdminRoutePrefix()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description={`${users.length.toLocaleString()} users loaded`}
      >
        <Button size="sm" className="gap-2 text-xs h-9">
          <UserPlus className="h-3.5 w-3.5" />
          Invite user
        </Button>
      </AdminPageHeader>

      <AdminDataTable
        title="All users"
        description="Manage roles, view profiles, and suspend accounts"
        columns={[
          {
            key: "user",
            label: "User",
            sortable: true,
            sortValue: (row) => row.name || row.email || "",
            render: (row) => (
              <Link href={`${adminPrefix}/users/${row.id}`} className="hover:text-amber-400 transition-colors">
                <p className="font-medium text-white">{row.name || "Unnamed"}</p>
                <p className="text-xs text-white/40">{row.email}</p>
              </Link>
            ),
          },
          {
            key: "role",
            label: "Role",
            render: (row) => <UserRoleEditor userId={row.id} currentRole={row.role ?? "USER"} />,
          },
          {
            key: "created_at",
            label: "Joined",
            sortable: true,
            render: (row) => (
              <span className="text-white/50 text-xs">
                {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Link
                href={`${adminPrefix}/users/${row.id}`}
                className="text-xs text-amber-400 hover:underline"
              >
                View profile
              </Link>
            ),
          },
        ]}
        rows={users}
        keyField="id"
        exportFileName="users.csv"
      />
    </div>
  )
}
