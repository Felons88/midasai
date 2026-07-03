import { getCreatorAccounts } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"

export default async function AdminCreatorsPage() {
  const creators = await getCreatorAccounts(500)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Creators"
        description={`${creators.length.toLocaleString()} creator accounts loaded`}
      />

      <AdminDataTable
        title="All creators"
        description="View creator accounts, verification status, and payout details"
        columns={[
          {
            key: "creator",
            label: "Creator",
            sortable: true,
            sortValue: (row) => row.user?.name ?? row.user?.email ?? "",
            render: (row) => (
              <div>
                <p className="font-medium text-white">{row.user?.name || "Unnamed"}</p>
                <p className="text-xs text-white/40">{row.user?.email}</p>
              </div>
            ),
          },
          {
            key: "verified",
            label: "Verified",
            render: (row) => (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.verified ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-white/60"}`}>
                {row.verified ? "Verified" : "Unverified"}
              </span>
            ),
          },
          {
            key: "commission_rate",
            label: "Commission",
            render: (row) => <span className="text-white/70 text-sm">{row.commission_rate}%</span>,
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
        ]}
        rows={creators}
        keyField="id"
        exportFileName="creators.csv"
      />
    </div>
  )
}
