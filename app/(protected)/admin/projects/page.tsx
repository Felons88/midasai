import { getAdminProjects } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"
import { Badge } from "@/components/ui/badge"

export default async function AdminProjectsPage() {
  const { sessions, expansions } = await getAdminProjects(100)

  const projects = [
    ...sessions.map((s) => ({
      id: s.id,
      name: s.session_name || "Untitled",
      type: "Architect Session",
      status: s.phase,
      confidence: s.confidence,
      fileCount: s.file_count,
      userId: s.user_id,
      createdAt: s.created_at,
    })),
    ...expansions.map((e) => ({
      id: e.id,
      name: e.title || "Untitled",
      type: "Workflow Expansion",
      status: e.status,
      confidence: e.pipeline_progress ?? 0,
      fileCount: e.file_count,
      userId: e.user_id,
      createdAt: e.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description={`${projects.length.toLocaleString()} Architect sessions and workflow expansions`}
      />

      <AdminDataTable
        title="All projects"
        description="Browse user-generated Architect sessions and workflow expansions"
        columns={[
          {
            key: "name",
            label: "Project",
            sortable: true,
            render: (row) => (
              <div>
                <p className="font-medium text-white">{row.name}</p>
                <p className="text-xs text-white/40">{row.type}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="outline" className="text-[10px] uppercase">
                {row.status}
              </Badge>
            ),
          },
          {
            key: "progress",
            label: "Progress",
            render: (row) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.max(0, Math.min(100, row.confidence ?? 0))}%` }}
                  />
                </div>
                <span className="text-xs text-white/50">{row.confidence ?? 0}%</span>
              </div>
            ),
          },
          {
            key: "fileCount",
            label: "Files",
            sortable: true,
            render: (row) => <span className="text-white/70 text-sm">{row.fileCount ?? 0}</span>,
          },
          {
            key: "createdAt",
            label: "Created",
            sortable: true,
            render: (row) => (
              <span className="text-white/50 text-xs">
                {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
              </span>
            ),
          },
        ]}
        rows={projects}
        keyField="id"
        exportFileName="projects.csv"
      />
    </div>
  )
}
