import Link from "next/link"
import { getModerationReports } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/AdminUi"
import { ModerationResolveButton } from "@/components/admin/ModerationResolveButton"

export default async function AdminModerationPage() {
  const reports = await getModerationReports(200)

  return (
    <div>
      <AdminPageHeader
        title="Moderation queue"
        description="User reports on listings and content"
      />

      <AdminTable headers={["Report", "Listing", "Reason", "Status", "Date", "Actions"]}>
        {reports.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-12 text-center text-white/40 text-sm">
              No moderation reports
            </td>
          </tr>
        ) : (
          reports.map((report) => {
            const reporter = report.reporter as { name?: string; email?: string } | null
            const listing = report.listing as { id?: string; title?: string } | null
            return (
              <tr key={report.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-sm text-white/80">{reporter?.email ?? "—"}</p>
                  {report.description && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{report.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {listing?.id ? (
                    <Link href={`/listing/${listing.id}`} className="text-amber-400 hover:underline">
                      {listing.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-white/60">{report.reason}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={report.status} />
                </td>
                <td className="px-4 py-3 text-xs text-white/40">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  {report.status === "OPEN" && (
                    <ModerationResolveButton reportId={report.id} />
                  )}
                </td>
              </tr>
            )
          })
        )}
      </AdminTable>
    </div>
  )
}
