import { getAdminProjects } from "@/lib/admin/queries"
import { AdminPageHeader } from "@/components/admin/AdminUi"
import { AdminDataTable } from "@/components/admin/AdminDataTable"
import { Badge } from "@/components/ui/badge"
import { ProjectNameCell, ProjectStatusCell, ProjectProgressCell, ProjectFilesCell, ProjectCreatedCell } from "@/components/admin/ProjectCells"

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
            render: ProjectNameCell,
          },
          {
            key: "status",
            label: "Status",
            render: ProjectStatusCell,
          },
          {
            key: "progress",
            label: "Progress",
            render: ProjectProgressCell,
          },
          {
            key: "fileCount",
            label: "Files",
            sortable: true,
            render: ProjectFilesCell,
          },
          {
            key: "createdAt",
            label: "Created",
            sortable: true,
            render: ProjectCreatedCell,
          },
        ]}
        rows={projects}
        keyField="id"
        exportFileName="projects.csv"
      />
    </div>
  )
}
