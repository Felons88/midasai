import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Star, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient, createPublicClient, createServiceClient } from "@/lib/supabase/server"
import { generateMetadata as generateSeoMetadata } from "@/lib/seo"
import { ListingFaqSection, ListingInstallSection } from "@/components/marketplace/ListingSupportSections"
import { VerifiedReviewBadge } from "@/components/marketplace/VerifiedReviewBadge"
import { ListingActions } from "@/components/marketplace/ListingActions"
import { ReviewSubmitForm } from "@/components/marketplace/ReviewSubmitForm"
import { MessageCreatorButton } from "@/components/messages/MessageCreatorButton"
import { FollowCreatorButton } from "@/components/creator/FollowCreatorButton"
import { ListingHero } from "@/components/marketplace/listing/ListingHero"
import { ListingDetailTabs } from "@/components/marketplace/listing/ListingDetailTabs"
import { ListingChangelog } from "@/components/marketplace/listing/ListingChangelog"
import { ListingDocumentation } from "@/components/marketplace/listing/ListingDocumentation"
import { ListingRelatedGrid } from "@/components/marketplace/listing/ListingRelatedGrid"
import { getListingDelivery } from "@/lib/listings/delivery"
import { fetchRelatedListings } from "@/lib/listings/related"
import {
  buildReviewVerificationMaps,
  EMPTY_REVIEW_VERIFICATION_MAPS,
  resolveReviewVerification,
} from "@/lib/reviews/verification"
import { trackServerEvent } from "@/lib/analytics-server"
import {
  averageRatingFromReviews,
  normalizeReviews,
  normalizeTags,
} from "@/lib/listings/normalize"

async function hasUserReviewed(listingId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reviews")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

async function getBookmarkState(listingId: string, userId?: string) {
  if (!userId) return false
  const supabase = await createClient()
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle()
  return Boolean(data)
}

async function getFollowState(creatorId: string, userId?: string) {
  if (!userId) return false
  const supabase = await createClient()
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", userId)
    .eq("following_id", creatorId)
    .maybeSingle()
  return Boolean(data)
}

async function getFollowerCount(creatorId: string) {
  const supabase = createPublicClient()
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", creatorId)
  return count ?? 0
}

async function getCreatorProfile(userId: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("creators")
    .select("slug, verified, display_name")
    .eq("user_id", userId)
    .maybeSingle()
  return data
}

async function getListing(id: string) {
  const supabase = createPublicClient()
  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      users!listings_creator_id_fkey(id, name, avatar_url),
      reviews(
        id, rating, comment, created_at, user_id,
        users(name, avatar_url),
        review_responses(id, response, updated_at)
      ),
      listing_faqs(id, question, answer, sort_order, published),
      listing_install_commands(id, platform, command, description, prerequisites, sort_order),
      listing_versions(id, version_name, version_number, changelog, created_at, file_size),
      categories(name, slug)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching listing:", error)
    return null
  }

  return listing
}

async function incrementViews(listingId: string, currentViews: number) {
  try {
    const service = createServiceClient()
    await service
      .from("listings")
      .update({ views: currentViews + 1 })
      .eq("id", listingId)
  } catch {
    // best-effort
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    return {
      title: "Listing Not Found | MidasAI",
      description: "The requested listing could not be found on MidasAI.",
    }
  }

  return generateSeoMetadata({
    title: listing.seo_title || listing.title,
    description: listing.short_description || listing.description,
    url: `/listing/${id}`,
    image: listing.images?.[0] ?? "/og-default.png",
    price: Number(listing.price) || 0,
  })
}

async function getReviewVerificationData(listingId: string) {
  try {
    const supabase = createServiceClient()
    const [transactionsResult, downloadsResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("user_id")
        .eq("listing_id", listingId)
        .eq("status", "COMPLETED"),
      supabase.from("downloads").select("user_id").eq("listing_id", listingId),
    ])

    return buildReviewVerificationMaps(
      transactionsResult.data ?? [],
      downloadsResult.data ?? []
    )
  } catch (error) {
    console.error("Review verification lookup failed:", error)
    return EMPTY_REVIEW_VERIFICATION_MAPS
  }
}

function ReviewsList({
  reviews,
  verificationMaps,
}: {
  reviews: Array<{
    id: string
    user_id: string
    rating: number
    comment: string | null
    created_at: string
    users?: { name?: string | null; avatar_url?: string | null } | null
    review_responses?: { response: string }[] | null
  }>
  verificationMaps: ReturnType<typeof buildReviewVerificationMaps>
}) {
  if (!reviews.length) {
    return <p className="text-sm text-text-tertiary py-4">No reviews yet. Be the first to review.</p>
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const verification = resolveReviewVerification(review.user_id, verificationMaps)
        return (
          <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-primary text-sm font-medium">
                {review.users?.name?.charAt(0) || "?"}
              </div>
              <span className="font-medium text-text-primary">
                {review.users?.name || "Anonymous"}
              </span>
              {verification && <VerifiedReviewBadge type={verification} />}
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < review.rating ? "fill-cta text-cta" : "text-text-tertiary"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-tertiary ml-auto">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p className="text-text-secondary text-sm pl-11">{review.comment}</p>
            )}
            {review.review_responses?.[0]?.response && (
              <div className="mt-3 ml-11 rounded-lg border border-cta/20 bg-cta/5 p-3">
                <p className="text-xs font-medium text-cta mb-1">Creator response</p>
                <p className="text-sm text-text-secondary">
                  {review.review_responses[0].response}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const publicSupabase = createPublicClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const listing = await getListing(id)
  if (!listing) notFound()

  const normalizedReviews = normalizeReviews(listing.reviews)
  const normalizedTags = normalizeTags(listing.tags)

  const [verificationMaps, initialBookmarked, userHasReviewed, initialFollowing, followerCount, relatedListings, creatorProfile] =
    await Promise.all([
      getReviewVerificationData(id),
      getBookmarkState(id, user?.id),
      user ? hasUserReviewed(id, user.id) : Promise.resolve(false),
      getFollowState(listing.creator_id, user?.id),
      getFollowerCount(listing.creator_id),
      fetchRelatedListings(publicSupabase, id, {
        categoryId: listing.category_id,
        type: listing.type,
        creatorId: listing.creator_id,
      }),
      getCreatorProfile(listing.creator_id),
    ])

  const creatorDisplayName =
    creatorProfile?.display_name ?? listing.users?.name ?? "@SYSTEM"

  incrementViews(id, listing.views ?? 0)
  trackServerEvent("listing_viewed", { listing_id: id })

  const canSubmitReview =
    Boolean(user) && !userHasReviewed && user!.id !== listing.creator_id

  const avgRating =
    normalizedReviews.length > 0
      ? averageRatingFromReviews(normalizedReviews, Number(listing.average_rating) || 0)
      : Number(listing.average_rating) || 0
  const reviewCount = normalizedReviews.length || listing.review_count || 0

  const faqs = (listing.listing_faqs ?? [])
    .filter((faq: { published?: boolean }) => faq.published !== false)
    .sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

  const installCommands = (listing.listing_install_commands ?? []).sort(
    (a: { sort_order?: number }, b: { sort_order?: number }) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const versions = (listing.listing_versions ?? []).sort(
    (a: { version_number?: number }, b: { version_number?: number }) =>
      (b.version_number ?? 0) - (a.version_number ?? 0)
  )

  const delivery = getListingDelivery(
    listing.files,
    listing.github_url,
    installCommands.length > 0
  )

  const overviewContent = (
    <div className="space-y-4 text-sm text-text-secondary">
      <p>{listing.description}</p>
      {listing.license && (
        <p>
          <span className="text-text-tertiary">License:</span> {listing.license}
        </p>
      )}
      {listing.language && (
        <p>
          <span className="text-text-tertiary">Language:</span> {listing.language}
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-8 md:py-12 relative">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" className="mb-6 transition-smooth" asChild>
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Link>
          </Button>

          <div className="mb-8 animate-fade-in-up">
            <ListingHero
              title={listing.seo_title || listing.title}
              description={listing.short_description || listing.description}
              type={listing.type}
              categoryName={listing.categories?.name}
              tags={normalizedTags}
              price={Number(listing.price) || 0}
              avgRating={avgRating}
              reviewCount={reviewCount}
              downloads={listing.downloads ?? 0}
              verified={creatorProfile?.verified ?? false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 animate-fade-in-up">
              <Card className="glass">
                <CardContent className="p-4 md:p-5">
                  <ListingActions
                    listingId={listing.id}
                    listingTitle={listing.title}
                    listingPrice={Number(listing.price) || 0}
                    githubUrl={listing.github_url}
                    delivery={delivery}
                    initialBookmarked={initialBookmarked}
                  />
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-4 md:p-6">
                  <ListingDetailTabs
                    tabs={[
                      {
                        id: "overview",
                        label: "Overview",
                        content: overviewContent,
                      },
                      {
                        id: "install",
                        label: "Install",
                        content: <ListingInstallSection commands={installCommands} embedded />,
                        hidden: installCommands.length === 0,
                      },
                      {
                        id: "docs",
                        label: "Documentation",
                        content: (
                          <ListingDocumentation
                            readme={listing.readme}
                            githubUrl={listing.github_url}
                          />
                        ),
                        hidden: !listing.readme && !listing.github_url,
                      },
                      {
                        id: "changelog",
                        label: "Changelog",
                        content: <ListingChangelog versions={versions} />,
                        hidden: versions.length === 0,
                      },
                      {
                        id: "faq",
                        label: "FAQ",
                        content: <ListingFaqSection faqs={faqs} embedded />,
                        hidden: faqs.length === 0,
                      },
                      {
                        id: "reviews",
                        label: `Reviews (${reviewCount})`,
                        content: (
                          <div className="space-y-6">
                            {canSubmitReview && <ReviewSubmitForm listingId={listing.id} />}
                            <ReviewsList
                              reviews={normalizedReviews}
                              verificationMaps={verificationMaps}
                            />
                          </div>
                        ),
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 animate-fade-in-up lg:sticky lg:top-24 lg:self-start">
              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-text-primary">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Type</span>
                    <span className="text-text-primary font-medium">{listing.type}</span>
                  </div>
                  {listing.categories && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Category</span>
                      <Link
                        href={`/search?query=${encodeURIComponent(listing.categories.name)}`}
                        className="text-cta hover:underline"
                      >
                        {listing.categories.name}
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Price</span>
                    <span className="text-cta font-bold">
                      {listing.price > 0 ? `$${listing.price}` : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Downloads</span>
                    <span className="flex items-center gap-1 text-text-primary">
                      <Download className="h-3.5 w-3.5" />
                      {listing.downloads || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Views</span>
                    <span className="flex items-center gap-1 text-text-primary">
                      <Eye className="h-3.5 w-3.5" />
                      {(listing.views ?? 0) + 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Rating</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-cta text-cta" />
                      {avgRating.toFixed(1)} ({reviewCount})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Updated</span>
                    <span className="text-text-primary">
                      {listing.updated_at
                        ? new Date(listing.updated_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-text-primary">Creator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link
                    href={creatorProfile?.slug ? `/creator/${creatorProfile.slug}` : "#"}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-11 h-11 bg-surface rounded-full flex items-center justify-center text-cta font-bold overflow-hidden shrink-0">
                      {listing.users?.avatar_url ? (
                        <img
                          src={listing.users.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (creatorDisplayName || "?").charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary group-hover:text-cta transition-smooth truncate">
                        {creatorDisplayName}
                      </p>
                      {creatorProfile?.slug && (
                        <p className="text-xs text-text-tertiary">@{creatorProfile.slug}</p>
                      )}
                    </div>
                  </Link>
                  <FollowCreatorButton
                    creatorId={listing.creator_id}
                    creatorName={creatorDisplayName}
                    initialFollowing={initialFollowing}
                    currentUserId={user?.id}
                    followerCount={followerCount}
                  />
                  <MessageCreatorButton
                    creatorId={listing.creator_id}
                    creatorName={creatorDisplayName}
                    listingTitle={listing.title}
                    listingId={listing.id}
                    currentUserId={user?.id}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <ListingRelatedGrid listings={relatedListings} />
        </div>
      </div>
    </div>
  )
}
