import Link from "next/link"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getAdminUsers } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"
import { UserRoleEditor } from "@/components/admin/UserRoleEditor"
import { UserStatusBadge } from "@/components/admin/UserStatusBadge"
import { UserBanButton } from "@/components/admin/UserBanButton"
import { UserFilterBar } from "@/components/admin/UserFilterBar"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const pageSize = 50
  const { data: users, count } = await getAdminUsers({
    search: typeof params.search === "string" ? params.search : undefined,
    role: typeof params.role === "string" ? params.role : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
    page,
    pageSize,
  })
  const adminPrefix = getAdminRoutePrefix()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description={`${count.toLocaleString()} users · page ${page}`}
      >
        <Button size="sm" className="gap-2 text-xs h-9">
          <UserPlus className="h-3.5 w-3.5" />
          Invite user
        </Button>
      </AdminPageHeader>

      <UserFilterBar />

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
            key: "status",
            label: "Status",
            render: (row) => <UserStatusBadge status={row.status} />,
          },
          {
            key: "last_active_at",
            label: "Last active",
            sortable: true,
            sortValue: (row) => (row.last_active_at ? new Date(row.last_active_at).getTime() : 0),
            render: (row) => (
              <span className="text-white/50 text-xs">
                {row.last_active_at ? new Date(row.last_active_at).toLocaleDateString() : "—"}
              </span>
            ),
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
              <div className="flex items-center gap-2">
                <Link
                  href={`${adminPrefix}/users/${row.id}`}
                  className="text-xs text-amber-400 hover:underline"
                >
                  View profile
                </Link>
                <UserBanButton userId={row.id} status={row.status} />
              </div>
            ),
          },
        ]}
        rows={users}
        keyField="id"
        exportFileName="users.csv"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          Showing {users.length} of {count} users
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`${adminPrefix}/users?page=${Math.max(1, page - 1)}${buildQuery(params)}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] ${
              page <= 1 ? "pointer-events-none opacity-50 text-white/30" : "text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            Previous
          </Link>
          <Link
            href={`${adminPrefix}/users?page=${page + 1}${buildQuery(params)}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] ${
              users.length < pageSize ? "pointer-events-none opacity-50 text-white/30" : "text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  )
}

function buildQuery(params: { [key: string]: string | string[] | undefined }) {
  const sp = new URLSearchParams()
  if (typeof params.search === "string") sp.set("search", params.search)
  if (typeof params.role === "string") sp.set("role", params.role)
  if (typeof params.status === "string") sp.set("status", params.status)
  if (typeof params.from === "string") sp.set("from", params.from)
  if (typeof params.to === "string") sp.set("to", params.to)
  const q = sp.toString()
  return q ? `&${q}` : ""
}
