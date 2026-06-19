import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { generateListingMetadata } from "@/lib/seo/metadata"
import { generateListingJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo/json-ld"
import { JsonLd } from "@/components/seo/JsonLd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Heart, Share2, Star, Eye } from "lucide-react"
import { LISTING_TYPE_LABELS } from "@/lib/search/types"
import type { ListingType } from "@/lib/search/types"

interface ListingPageProps {
  params: Promise<{ id: string }>
}

async function getListing(idOrSlug: string) {
  const supabase = await createClient()

  // Try slug first, then ID
  let query = supabase
    .from('listings')
    .select(`
      *,
      creator:users!listings_creator_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name, slug),
      listing_tags(tag:tags(id, name, slug))
    `)
    .eq('status', 'ACTIVE')

  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  if (isUUID) {
    query = query.eq('id', idOrSlug)
  } else {
    query = query.eq('slug', idOrSlug)
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    return { title: 'Listing Not Found' }
  }

  return generateListingMetadata(listing)
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    notFound()
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://midasai.com'
  const tags = (listing.listing_tags as { tag: { id: string; name: string; slug: string } }[])?.map(
    (lt) => lt.tag
  ) ?? []

  const jsonLdData = [
    generateListingJsonLd({
      ...listing,
      creator: listing.creator as { name: string | null; avatar_url?: string | null } | null,
      category: listing.category as { name: string } | null,
    }),
    generateBreadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: LISTING_TYPE_LABELS[listing.type as ListingType] ?? listing.type, url: `${SITE_URL}/${listing.type.toLowerCase()}` },
      { name: listing.title, url: `${SITE_URL}/listing/${listing.slug ?? listing.id}` },
    ]),
  ]

  const creator = listing.creator as { id: string; name: string | null; avatar_url: string | null } | null
  const category = listing.category as { id: string; name: string; slug: string } | null

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLd data={jsonLdData} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {LISTING_TYPE_LABELS[listing.type as ListingType] ?? listing.type}
            </span>
            {category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {category.name}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold font-heading mb-2">{listing.title}</h1>
          <p className="text-muted-foreground text-lg">
            {listing.description.slice(0, 200)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                {listing.images && listing.images.length > 0 ? (
                  <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted/30 rounded-lg mb-4 flex items-center justify-center border border-border/40">
                    <span className="text-muted-foreground">Preview</span>
                  </div>
                )}
                <div className="flex gap-2 mb-4">
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    {listing.price === 0 ? 'Download Free' : `Purchase - $${listing.price}`}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {tags.length > 0 && (
              <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-muted/50 text-muted-foreground border border-border/40"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-sm">{LISTING_TYPE_LABELS[listing.type as ListingType] ?? listing.type}</span>
                </div>
                {category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-sm">
                    {listing.price === 0 ? 'Free' : `$${listing.price}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Downloads</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Download className="h-3 w-3" />
                    {listing.downloads.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Eye className="h-3 w-3" />
                    {listing.views.toLocaleString()}
                  </span>
                </div>
                {listing.average_rating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm">{listing.average_rating} ({listing.review_count})</span>
                    </div>
                  </div>
                )}
                {listing.platform && listing.platform.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm">Platforms</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {listing.platform.map((p: string) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/40">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {creator && (
              <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.name ?? 'Creator'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                        {creator.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{creator.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
