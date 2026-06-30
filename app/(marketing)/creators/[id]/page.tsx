import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Download, ExternalLink, Calendar } from "lucide-react"
import {
  MarketplaceCard,
  MarketplaceCardData,
  MarketplaceEmptyState,
} from "@/components/marketplace/MarketplaceCard"
import type { Metadata } from "next"

type CreatorProfilePageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CreatorProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: creator } = await supabase
    .from("creators")
    .select("display_name, bio")
    .eq("user_id", id)
    .single()
  return {
    title: creator?.display_name ? `${creator.display_name} | MidasAI Creator` : "Creator Profile | MidasAI",
    description: creator?.bio ?? "Explore products by this creator on MidasAI.",
  }
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: creator } = await supabase
    .from("creators")
    .select("user_id, display_name, bio, avatar_url, verified, total_revenue, followers_count")
    .eq("user_id", id)
    .single()

  const { data: user } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", id)
    .single()

  if (!creator && !user) {
    notFound()
  }

  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id, title, seo_title, description, short_description, type, price, downloads, views, average_rating, review_count, images, tags, updated_at, featured,
      creator:users!listings_creator_id_fkey(id, name, avatar_url, creator_profile:creators!creators_user_id_fkey(verified))
    `)
    .eq("creator_id", id)
    .eq("status", "ACTIVE")
    .order("downloads", { ascending: false, nullsFirst: false })
    .limit(24)

  const products = (listings ?? []).map((item: any) => {
    const creatorData = item.creator
      ? {
          name: item.creator.name,
          avatar_url: item.creator.avatar_url,
          verified: item.creator.creator_profile?.verified ?? false,
        }
      : undefined
    return {
      id: item.id,
      title: item.title,
      seo_title: item.seo_title,
      description: item.description,
      short_description: item.short_description,
      type: item.type,
      price: item.price,
      downloads: item.downloads,
      views: item.views,
      average_rating: item.average_rating,
      review_count: item.review_count,
      images: item.images,
      tags: item.tags,
      updated_at: item.updated_at,
      creator: creatorData,
      featured: item.featured,
      verified: creatorData?.verified,
    } as MarketplaceCardData
  })

  const displayName = creator?.display_name ?? user?.name ?? "Creator"
  const avatarUrl = creator?.avatar_url ?? user?.avatar_url
  const bio = creator?.bio ?? ""
  const totalDownloads = products.reduce((sum, p) => sum + (p.downloads ?? 0), 0)
  const avgRating =
    products.length > 0
      ? products.reduce((sum, p) => sum + (Number(p.average_rating) || 0), 0) / products.length
      : 0

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-24 w-24 rounded-full bg-cta/10 border border-cta/20 flex items-center justify-center text-2xl font-bold text-cta shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-text-primary">{displayName}</h1>
                  {creator?.verified && (
                    <Badge variant="outline" className="border-cta/30 text-cta">
                      Verified
                    </Badge>
                  )}
                </div>
                {bio && <p className="text-text-secondary max-w-2xl">{bio}</p>}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" /> {totalDownloads} downloads
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" /> {avgRating > 0 ? avgRating.toFixed(1) : "—"} avg rating
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {products.length} products
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">Products</h2>
          </div>
          {products.length === 0 ? (
            <MarketplaceEmptyState
              title="No products yet"
              description="This creator hasn't published any products."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((listing, index) => (
                <MarketplaceCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
