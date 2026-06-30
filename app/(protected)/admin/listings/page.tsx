import Link from "next/link"
import { Eye } from "lucide-react"
import { getAdminListings } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/AdminUi"
import { ListingModerationActions } from "@/components/admin/ListingModerationActions"
export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = "ALL" } = await searchParams
  const listings = await getAdminListings(status, 200)

  const filters = ["ALL", "PENDING", "ACTIVE", "REJECTED", "DRAFT"] as const

  return (
    <div>
      <AdminPageHeader title="Listings" description="Review, approve, and manage marketplace content" />

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "?" : `?status=${f}`}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              status === f
                ? "bg-amber-500/15 text-amber-400"
                : "bg-white/[0.04] text-white/50 hover:text-white/80"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      <AdminTable headers={["Listing", "Creator", "Price", "Status", "Stats", "Actions"]}>
        {listings.map((listing) => {
          const creator = listing.creator as { name?: string; email?: string } | null
          return (
            <tr key={listing.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <p className="text-white font-medium">{listing.title}</p>
                <p className="text-xs text-white/40">{listing.type}</p>
              </td>
              <td className="px-4 py-3 text-white/60 text-xs">
                {creator?.name || creator?.email || "—"}
              </td>
              <td className="px-4 py-3 text-white">${listing.price}</td>
              <td className="px-4 py-3">
                <StatusBadge status={listing.status} />
              </td>
              <td className="px-4 py-3 text-xs text-white/40">
                {listing.downloads} dl · {listing.views} views
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/60 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <ListingModerationActions listingId={listing.id} status={listing.status ?? ""} />
                </div>
              </td>
            </tr>
          )
        })}
      </AdminTable>
    </div>
  )
}
