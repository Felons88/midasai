import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Download, Star } from "lucide-react"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCreatorButton } from "@/components/messages/MessageCreatorButton"
import { FollowCreatorButton } from "@/components/creator/FollowCreatorButton"
import { CreatorSocialLinks } from "@/components/creator/CreatorSocialLinks"
import { CreatorActivityFeed } from "@/components/creator/CreatorActivityFeed"
import { fetchCreatorActivity } from "@/lib/activity/feed"

async function getCreatorBySlug(slug: string) {
  const supabase = createPublicClient()
  const { data: creator, error } = await supabase
    .from("creators")
    .select(`
      *,
      users(name, avatar_url, website, github_username, twitter_username, linkedin_url, discord_url)
    `)
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("Error fetching creator:", error)
    return null
  }

  return creator
}

async function getCreatorListings(userId: string) {
  const supabase = createPublicClient()
  const { data: listings, error } = await supabase
    .from("listings")
    .select(`
      id, title, description, type, price, downloads, views,
      reviews(rating)
    `)
    .eq("creator_id", userId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching creator listings:", error)
    return []
  }

  return listings ?? []
}

async function getFollowerCount(userId: string) {
  const supabase = createPublicClient()
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId)
  return count ?? 0
}

async function getFollowState(creatorUserId: string, viewerId?: string) {
  if (!viewerId) return false
  const supabase = await createClient()
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", viewerId)
    .eq("following_id", creatorUserId)
    .maybeSingle()
  return Boolean(data)
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const creator = await getCreatorBySlug(slug)

  if (!creator) {
    notFound()
  }

  const listings = await getCreatorListings(creator.user_id)
  const [followerCount, initialFollowing, activity] = await Promise.all([
    getFollowerCount(creator.user_id),
    getFollowState(creator.user_id, user?.id),
    fetchCreatorActivity(creator.user_id),
  ])

  const avatarUrl = creator.users?.avatar_url
  const userName = creator.users?.name
  const social = creator.users as {
    website?: string | null
    github_username?: string | null
    twitter_username?: string | null
    linkedin_url?: string | null
    discord_url?: string | null
  } | null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
          <Card className="glass overflow-hidden">
            {creator.banner_url && (
              <div className="h-40 md:h-52 w-full overflow-hidden">
                <img
                  src={creator.banner_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-surface border border-white/10 flex items-center justify-center text-cta font-bold text-2xl shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={creator.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    creator.display_name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                      {creator.display_name}
                    </h1>
                    {creator.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  {userName && userName !== creator.display_name && (
                    <p className="text-sm text-text-tertiary mb-2">@{slug}</p>
                  )}
                  {creator.bio && (
                    <p className="text-text-secondary max-w-2xl">{creator.bio}</p>
                  )}
                  <CreatorSocialLinks
                    website={social?.website}
                    githubUsername={social?.github_username}
                    twitterUsername={social?.twitter_username}
                    linkedinUrl={social?.linkedin_url}
                    discordUrl={social?.discord_url}
                  />
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-tertiary">
                    <span>{listings.length} active listings</span>
                    <span>{creator.total_downloads ?? 0} total downloads</span>
                    <span>{followerCount} followers</span>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-sm">
                    <FollowCreatorButton
                      creatorId={creator.user_id}
                      creatorName={creator.display_name}
                      initialFollowing={initialFollowing}
                      currentUserId={user?.id}
                      followerCount={followerCount}
                    />
                    <MessageCreatorButton
                      creatorId={creator.user_id}
                      creatorName={creator.display_name}
                      currentUserId={user?.id}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CreatorActivityFeed items={activity} />

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Listings</h2>
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => {
                  const ratings = listing.reviews?.map((r: { rating: number }) => r.rating) ?? []
                  const avgRating =
                    ratings.length > 0
                      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                      : 0

                  return (
                    <Link
                      key={listing.id}
                      href={`/listing/${listing.id}`}
                      className="group p-5 rounded-xl border border-white/10 bg-surface/50 hover:bg-surface hover:shadow-glow transition-smooth"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-cta bg-cta/10 px-2 py-0.5 rounded">
                          {listing.type}
                        </span>
                        {listing.price === 0 && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Free
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-cta transition-smooth mb-1.5 truncate">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-text-tertiary line-clamp-2 mb-3">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {listing.downloads ?? 0}
                          </span>
                          {ratings.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-cta text-cta" />
                              {avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-text-primary">
                          {listing.price > 0 ? `$${listing.price}` : "Free"}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <p className="text-text-secondary">No active listings yet.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
