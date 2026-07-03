import { getAdminCategories } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories(200)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description={`${categories.length.toLocaleString()} categories loaded`}
      />

      <AdminDataTable
        title="Marketplace categories"
        description="Manage category names, slugs, and visibility"
        columns={[
          {
            key: "name",
            label: "Name",
            sortable: true,
            render: (row) => (
              <div>
                <p className="font-medium text-white">{row.name}</p>
                <p className="text-xs text-white/40">/{row.slug}</p>
              </div>
            ),
          },
          {
            key: "description",
            label: "Description",
            render: (row) => <p className="text-white/60 text-sm truncate max-w-[240px]">{row.description || "—"}</p>,
          },
          {
            key: "icon",
            label: "Icon",
            render: (row) => <span className="text-white/70 text-sm">{row.icon || "—"}</span>,
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
        rows={categories}
        keyField="id"
        exportFileName="categories.csv"
      />
    </div>
  )
}
