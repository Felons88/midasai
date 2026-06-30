import Link from "next/link"
import { getAdminAssets, formatBytes, getAdminOverview } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable, StatCard } from "@/components/admin/AdminUi"

export default async function AdminFilesPage() {
  const [assets, overview] = await Promise.all([getAdminAssets(200), getAdminOverview()])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Files & storage"
        description="Uploaded assets across listings and user profiles"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total assets" value={overview.totalAssets} />
        <StatCard label="Storage used" value={formatBytes(overview.storageBytes)} accent />
        <StatCard label="Avg file size" value={overview.totalAssets > 0 ? formatBytes(Math.round(overview.storageBytes / overview.totalAssets)) : "—"} />
      </div>

      <AdminTable headers={["File", "Type", "Size", "Owner / Listing", "Uploaded"]}>
        {assets.map((asset) => {
          const listing = asset.listing as { id?: string; title?: string } | null
          const user = asset.user as { name?: string; email?: string } | null
          return (
            <tr key={asset.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 max-w-xs">
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline text-xs font-mono truncate block"
                >
                  {asset.url}
                </a>
              </td>
              <td className="px-4 py-3 text-xs text-white/60">
                {asset.type}
                {asset.mime_type && <span className="text-white/30"> · {asset.mime_type}</span>}
              </td>
              <td className="px-4 py-3 text-white/70 text-sm">
                {asset.file_size ? formatBytes(asset.file_size) : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-white/60">
                {listing?.id ? (
                  <Link href={`/listing/${listing.id}`} className="hover:text-amber-400">
                    {listing.title}
                  </Link>
                ) : (
                  user?.email ?? "—"
                )}
              </td>
              <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          )
        })}
      </AdminTable>
    </div>
  )
}
