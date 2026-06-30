import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type RelatedListing = {
  id: string
  title: string
  seo_title: string | null
  description: string
  short_description: string | null
  price: number
  type: string
  images: string[] | null
  downloads: number | null
  average_rating: number | null
}

interface ListingRelatedGridProps {
  listings: RelatedListing[]
}

export function ListingRelatedGrid({ listings }: ListingRelatedGridProps) {
  if (!listings.length) return null

  return (
    <section className="mt-12 pt-8 border-t border-white/10">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Related products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="glass hover:shadow-glow transition-smooth group">
            <CardHeader className="space-y-3 p-4">
              <CardTitle className="text-base line-clamp-1">{listing.seo_title || listing.title}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {listing.short_description || listing.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="font-bold text-cta">
                {listing.price > 0 ? `$${listing.price}` : "Free"}
              </span>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/listing/${listing.id}`}>View</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
