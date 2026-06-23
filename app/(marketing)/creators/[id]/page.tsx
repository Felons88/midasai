import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Globe, Github, Twitter, Linkedin, MessageCircle, Star, Activity, DollarSign, Download, Package, Users } from "lucide-react"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FollowButton } from "@/components/creator/follow-button"
import { ProfileEditor } from "./profile-editor"

async function getCreator(userId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, created_at, bio, website, github_username, twitter_username, linkedin_url, discord_url")
    .eq("id", userId)
    .maybeSingle()
  if (error) {
    console.error("Error fetching creator:", error)
    return null
  }
  return data
}

async function getCreatorListings(userId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("listings")
    .select("id, title, description, type, price, average_rating, review_count, images")
    .eq("creator_id", userId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
  return data || []
}

async function getCreatorStats(userId: string) {
  const svc = createServiceClient()
  const [followers, following, products, revenue] = await Promise.all([
    svc.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
    svc.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
    svc.from("listings").select("downloads, average_rating, review_count").eq("creator_id", userId).eq("status", "ACTIVE"),
    svc.from("transactions").select("net_amount").eq("creator_id", userId).eq("status", "COMPLETED"),
  ])
  const list = products.data || []
  const downloads = list.reduce((s, l: any) => s + (l.downloads || 0), 0)
  const reviews = list.reduce((s, l: any) => s + (l.review_count || 0), 0)
  const rated = list.filter((l: any) => (l.average_rating || 0) > 0)
  const avgRating = rated.length ? rated.reduce((s, l: any) => s + Number(l.average_rating || 0), 0) / rated.length : 0
  const totalRevenue = (revenue.data || []).reduce((s, t: any) => s + Number(t.net_amount || 0), 0)
  return {
    followers: followers.count || 0,
    following: following.count || 0,
    products: list.length,
    downloads,
    reviews,
    avgRating,
    totalRevenue,
  }
}

async function getActivity(userId: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from("activity_feed")
    .select("id, event_type, entity_type, entity_title, entity_id, created_at")
    .eq("actor_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(12)
  return data || []
}

async function getViewer(creatorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isAuthenticated: false, isOwner: false, isFollowing: false }
  const { data: follow } = await supabase
    .from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", creatorId).maybeSingle()
  return { isAuthenticated: true, isOwner: user.id === creatorId, isFollowing: !!follow }
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-sm text-text-tertiary">{label}</div>
    </div>
  )
}

function eventText(e: any) {
  const map: Record<string, string> = {
    listing_created: "published", listing_published: "published",
    review_created: "reviewed", follow_created: "followed", listing_updated: "updated",
  }
  const verb = map[e.event_type] || e.event_type?.replace(/_/g, " ") || "did"
  return `${verb} ${e.entity_title || e.entity_type || ""}`.trim()
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const creator = await getCreator(id)
  if (!creator) notFound()

  const [listings, stats, activity, viewer] = await Promise.all([
    getCreatorListings(id),
    getCreatorStats(id),
    getActivity(id),
    getViewer(id),
  ])

  const socials = [
    creator.website && { icon: Globe, href: creator.website, label: "Website" },
    creator.github_username && { icon: Github, href: `https://github.com/${creator.github_username}`, label: "GitHub" },
    creator.twitter_username && { icon: Twitter, href: `https://x.com/${creator.twitter_username}`, label: "X" },
    creator.linkedin_url && { icon: Linkedin, href: creator.linkedin_url, label: "LinkedIn" },
    creator.discord_url && { icon: MessageCircle, href: creator.discord_url, label: "Discord" },
  ].filter(Boolean) as { icon: any; href: string; label: string }[]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <div className="glass rounded-2xl p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.name || "Creator"} className="w-28 h-28 rounded-full object-cover border-4 border-cta/20" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-surface flex items-center justify-center border-4 border-cta/20">
                      <User className="h-14 w-14 text-text-tertiary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{creator.name || "Creator"}</h1>
                      <p className="text-sm text-text-tertiary mt-1">Member since {new Date(creator.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                      {viewer.isOwner ? null : (
                        <FollowButton creatorId={id} isAuthenticated={viewer.isAuthenticated} initialIsFollowing={viewer.isFollowing} />
                      )}
                    </div>
                  </div>

                  {creator.bio && <p className="text-base text-text-secondary mt-4 max-w-2xl">{creator.bio}</p>}

                  {socials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {socials.map((s) => (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                           className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors">
                          <s.icon className="h-4 w-4" />{s.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Public stats */}
                  <div className="flex flex-wrap gap-8 mt-6">
                    <StatBlock value={stats.products} label="Products" />
                    <StatBlock value={stats.followers} label="Followers" />
                    <StatBlock value={stats.following} label="Following" />
                    <StatBlock value={stats.downloads.toLocaleString()} label="Downloads" />
                    {stats.avgRating > 0 && <StatBlock value={stats.avgRating.toFixed(1)} label="Avg Rating" />}
                  </div>

                  {viewer.isOwner && (
                    <ProfileEditor
                      userId={id}
                      initial={{
                        bio: creator.bio || "", website: creator.website || "",
                        github_username: creator.github_username || "", twitter_username: creator.twitter_username || "",
                        linkedin_url: creator.linkedin_url || "", discord_url: creator.discord_url || "",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Owner-only revenue strip */}
          {viewer.isOwner && (
            <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
              <Card className="glass"><CardContent className="p-5"><div className="flex items-center gap-2 text-text-tertiary text-sm mb-1"><DollarSign className="h-4 w-4" />Revenue</div><div className="text-2xl font-bold text-text-primary">${stats.totalRevenue.toFixed(2)}</div></CardContent></Card>
              <Card className="glass"><CardContent className="p-5"><div className="flex items-center gap-2 text-text-tertiary text-sm mb-1"><Download className="h-4 w-4" />Downloads</div><div className="text-2xl font-bold text-text-primary">{stats.downloads.toLocaleString()}</div></CardContent></Card>
              <Card className="glass"><CardContent className="p-5"><div className="flex items-center gap-2 text-text-tertiary text-sm mb-1"><Package className="h-4 w-4" />Products</div><div className="text-2xl font-bold text-text-primary">{stats.products}</div></CardContent></Card>
              <Card className="glass"><CardContent className="p-5"><div className="flex items-center gap-2 text-text-tertiary text-sm mb-1"><Star className="h-4 w-4" />Reviews</div><div className="text-2xl font-bold text-text-primary">{stats.reviews}</div></CardContent></Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio */}
            <div className="lg:col-span-2 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2"><Package className="h-5 w-5 text-cta" />Portfolio</h2>
              {listings.length === 0 ? (
                <Card className="glass"><CardContent className="p-12 text-center"><p className="text-xl text-text-secondary">No listings yet</p><p className="text-text-tertiary mt-2">This creator hasn&apos;t published any listings.</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {listings.map((listing: any) => (
                    <Card key={listing.id} className="glass hover:shadow-glow transition-smooth group">
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-cta bg-cta/10 px-2 py-0.5 rounded">{listing.type}</span>
                          {listing.average_rating > 0 && (
                            <span className="flex items-center gap-1 text-sm text-text-secondary"><Star className="h-3.5 w-3.5 fill-cta text-cta" />{Number(listing.average_rating).toFixed(1)} <span className="text-text-tertiary">({listing.review_count})</span></span>
                          )}
                        </div>
                        <CardTitle className="text-lg text-text-primary line-clamp-1">{listing.title}</CardTitle>
                        <CardDescription className="text-sm text-text-secondary line-clamp-2">{listing.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-text-primary">{listing.price > 0 ? `$${listing.price}` : "Free"}</span>
                          <Button size="sm" className="group-hover:shadow-glow transition-smooth" asChild><Link href={`/listing/${listing.id}`}>View</Link></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-cta" />Activity</h2>
              {activity.length === 0 ? (
                <Card className="glass"><CardContent className="p-8 text-center text-text-tertiary">No public activity yet.</CardContent></Card>
              ) : (
                <Card className="glass"><CardContent className="p-5 space-y-4">
                  {activity.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0"><Users className="h-4 w-4 text-cta" /></div>
                      <div>
                        <p className="text-sm text-text-secondary">{creator.name} {eventText(a)}</p>
                        <p className="text-xs text-text-tertiary">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
