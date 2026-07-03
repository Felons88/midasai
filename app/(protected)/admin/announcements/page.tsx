import { getAdminAnnouncements } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"
import { Badge } from "@/components/ui/badge"

export default async function AdminAnnouncementsPage() {
  const announcements = await getAdminAnnouncements(200)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Announcements"
        description={`${announcements.length.toLocaleString()} announcements loaded`}
      />

      <AdminDataTable
        title="Platform announcements"
        description="Manage banners, changelogs, and scheduled announcements"
        columns={[
          {
            key: "title",
            label: "Title",
            sortable: true,
            render: (row) => (
              <div>
                <p className="font-medium text-white">{row.title}</p>
                <p className="text-xs text-white/40">{row.kind}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant={row.is_active ? "default" : "secondary"} className="text-[10px] uppercase">
                {row.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "schedule",
            label: "Schedule",
            render: (row) => (
              <span className="text-white/50 text-xs">
                {row.starts_at ? new Date(row.starts_at).toLocaleDateString() : "—"}
                {row.ends_at ? ` → ${new Date(row.ends_at).toLocaleDateString()}` : ""}
              </span>
            ),
          },
          {
            key: "created_at",
            label: "Created",
            sortable: true,
            render: (row) => (
              <span className="text-white/50 text-xs">
                {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
              </span>
            ),
          },
        ]}
        rows={announcements}
        keyField="id"
        exportFileName="announcements.csv"
      />
    </div>
  )
}
