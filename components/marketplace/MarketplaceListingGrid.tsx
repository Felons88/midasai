import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { MarketplaceListingRow } from "@/lib/marketplace/paginated-listings"
import { MarketplacePagination } from "@/components/marketplace/MarketplacePagination"

type MarketplaceListingGridProps = {
  listings: MarketplaceListingRow[]
  total: number
  page: number
  limit: number
  basePath: string
  emptyMessage?: string
}

export function MarketplaceListingGrid({
  listings,
  total,
  page,
  limit,
  basePath,
  emptyMessage = "No listings found.",
}: MarketplaceListingGridProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-8">
      <MarketplacePagination
        basePath={basePath}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
      />

      {listings.length === 0 ? (
        <div className="text-center py-24 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-xl text-text-secondary">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing, index) => (
            <Card
              key={listing.id}
              className="glass hover:shadow-glow transition-smooth group h-full flex flex-col"
              style={{ animationDelay: `${(index % 12) * 0.03}s` }}
            >
              <CardHeader className="space-y-3 p-4 flex-1">
                <CardTitle className="text-lg text-text-primary line-clamp-2 leading-snug">
                  {listing.seo_title || listing.title}
                </CardTitle>
                <CardDescription className="text-sm text-text-secondary line-clamp-3 min-h-[3.75rem]">
                  {listing.short_description || listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-cta">
                    {Number(listing.price) > 0 ? `$${listing.price}` : "Free"}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {listing.downloads ?? 0} downloads
                    {listing.average_rating
                      ? ` · ${Number(listing.average_rating).toFixed(1)}★`
                      : ""}
                  </p>
                </div>
                <Button size="sm" className="shrink-0" asChild>
                  <Link href={`/listing/${listing.id}`}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <MarketplacePagination
          basePath={basePath}
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
        />
      )}
    </div>
  )
}
