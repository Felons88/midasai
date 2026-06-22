import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Download, Star, ArrowLeft, Eye, Clock, Code2, Scale, Tag, Package,
  Sparkles, Server, Bot, LayoutTemplate, Plug, BookOpen, History, MessageSquare, User,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { InstallBlock } from "./install-block"
import { ListingActions } from "./listing-actions"
import { FollowButton } from "@/components/creator/follow-button"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TYPE_ICON: Record<string, any> = {
  SKILL: Sparkles, WORKFLOW: Code2, TEMPLATE: LayoutTemplate, PLUGIN: Plug, MCP: Server, AGENT: Bot,
}

async function getListing(id: string) {
  if (!UUID_RE.test(id)) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle()
    if (error) {
      console.error("Error fetching listing:", error)
      return null
    }
    return data
  } catch (e) {
    console.error("Error in getListing:", e)
    return null
  }
}

// Public-safe creator fields (service client → readable for any creator, no email/role exposure).
async function getCreator(creatorId: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from("users")
    .select("id, name, avatar_url, created_at")
    .eq("id", creatorId)
    .maybeSingle()
  return data
}

async function getCreatorStats(creatorId: string) {
  const svc = createServiceClient()
  const [{ count: followerCount }, { data: products }] = await Promise.all([
    svc.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", creatorId),
    svc.from("listings").select("id, downloads, average_rating").eq("creator_id", creatorId).eq("status", "ACTIVE"),
  ])
  const productList = products || []
  const downloads = productList.reduce((s, l: any) => s + (l.downloads || 0), 0)
  const rated = productList.filter((l: any) => (l.average_rating || 0) > 0)
  const avgRating = rated.length ? rated.reduce((s, l: any) => s + Number(l.average_rating || 0), 0) / rated.length : 0
  return { followerCount: followerCount || 0, products: productList.length, downloads, avgRating }
}

async function getReviews(listingId: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from("reviews")
    .select("id, rating, comment, created_at, users(name, avatar_url)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
  return data || []
}

async function getVersions(listingId: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from("listing_versions")
    .select("id, version_number, version_name, changelog, created_at")
    .eq("listing_id", listingId)
    .order("version_number", { ascending: false })
  return data || []
}

async function getRelated(listing: any) {
  const svc = createServiceClient()
  const [more, similar] = await Promise.all([
    svc.from("listings").select("id, title, type, price, average_rating, review_count")
      .eq("creator_id", listing.creator_id).eq("status", "ACTIVE").neq("id", listing.id).limit(4),
    svc.from("listings").select("id, title, type, price, average_rating, review_count")
      .eq("type", listing.type).eq("status", "ACTIVE").neq("id", listing.id).limit(4),
  ])
  return { more: more.data || [], similar: similar.data || [] }
}

async function getViewerState(listingId: string, creatorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isAuthenticated: false, bookmarked: false, following: false }
  const [{ data: bm }, { data: fl }] = await Promise.all([
    supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("listing_id", listingId).maybeSingle(),
    supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", creatorId).maybeSingle(),
  ])
  return { isAuthenticated: true, bookmarked: !!bm, following: !!fl }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) return { title: "Listing not found — MidasAI" }
  return { title: `${listing.title} — MidasAI`, description: listing.description?.slice(0, 160) }
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-text-tertiary" />
      <span className="text-text-primary font-medium">{value}</span>
      <span className="text-text-tertiary text-sm">{label}</span>
    </div>
  )
}

function RelatedCard({ item }: { item: any }) {
  const Icon = TYPE_ICON[item.type] || Package
  return (
    <Link href={`/listing/${item.id}`} className="block group">
      <Card className="glass h-full hover:shadow-glow transition-smooth">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
              <Icon className="h-4 w-4 text-cta" />
            </div>
            <span className="text-xs text-text-tertiary uppercase tracking-wide">{item.type}</span>
          </div>
          <p className="font-semibold text-text-primary line-clamp-1 group-hover:text-cta transition-colors">{item.title}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-primary font-bold">{item.price > 0 ? `$${item.price}` : "Free"}</span>
            {item.average_rating > 0 && (
              <span className="flex items-center gap-1 text-text-secondary">
                <Star className="h-3.5 w-3.5 fill-cta text-cta" />{Number(item.average_rating).toFixed(1)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const [creator, stats, reviews, versions, related, viewer] = await Promise.all([
    getCreator(listing.creator_id),
    getCreatorStats(listing.creator_id),
    getReviews(listing.id),
    getVersions(listing.id),
    getRelated(listing),
    getViewerState(listing.id, listing.creator_id),
  ])

  const Icon = TYPE_ICON[listing.type] || Package
  const reviewCount = reviews.length
  const avgRating = reviewCount
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviewCount
    : Number(listing.average_rating || 0)
  const latestVersion = versions[0]?.version_name

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-10 relative">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" className="mb-8 transition-smooth" asChild>
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Marketplace</Link>
          </Button>

          {/* HERO */}
          <div className="glass rounded-2xl p-6 md:p-8 mb-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center border border-white/10">
                  <Icon className="h-10 w-10 text-cta" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-cta bg-cta/10 px-2 py-0.5 rounded">{listing.type}</span>
                  {latestVersion && <span className="text-xs text-text-tertiary border border-white/10 px-2 py-0.5 rounded">{latestVersion}</span>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">{listing.title}</h1>
                <p className="text-lg text-text-secondary mb-4">{listing.description}</p>

                {creator && (
                  <Link href={`/creators/${creator.id}`} className="inline-flex items-center gap-2 mb-5 group">
                    <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-cta text-xs font-bold overflow-hidden">
                      {creator.avatar_url ? <img src={creator.avatar_url} alt={creator.name || "Creator"} className="w-full h-full object-cover" /> : (creator.name?.charAt(0) || "?")}
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">by <span className="font-medium text-text-primary">{creator.name || "Anonymous"}</span></span>
                  </Link>
                )}

                {/* Trust signals */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
                  <Stat icon={Download} label="downloads" value={(listing.downloads || 0).toLocaleString()} />
                  <Stat icon={Star} label={`(${reviewCount} reviews)`} value={avgRating.toFixed(1)} />
                  <Stat icon={Eye} label="views" value={(listing.views || 0).toLocaleString()} />
                  <Stat icon={User} label="followers" value={stats.followerCount.toLocaleString()} />
                  <Stat icon={Clock} label="updated" value={new Date(listing.updated_at).toLocaleDateString()} />
                </div>

                <ListingActions
                  listingId={listing.id}
                  title={listing.title}
                  price={Number(listing.price || 0)}
                  creatorId={listing.creator_id}
                  githubUrl={listing.github_url || null}
                  isAuthenticated={viewer.isAuthenticated}
                  initialBookmarked={viewer.bookmarked}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN */}
            <div className="lg:col-span-2 space-y-8">
              {/* Installation */}
              {listing.github_url && (
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-cta" />Installation</h2>
                  <div className="space-y-3">
                    <InstallBlock label="git" command={`git clone ${listing.github_url}`} />
                  </div>
                </section>
              )}

              {/* Documentation */}
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-cta" />Documentation</h2>
                {listing.readme ? (
                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="markdown-body text-text-secondary space-y-4 break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: (p) => <h1 className="text-2xl font-bold text-text-primary mt-6 mb-3" {...p} />,
                            h2: (p) => <h2 className="text-xl font-bold text-text-primary mt-6 mb-3" {...p} />,
                            h3: (p) => <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2" {...p} />,
                            p: (p) => <p className="leading-relaxed" {...p} />,
                            a: (p) => <a className="text-cta hover:underline" target="_blank" rel="noopener noreferrer" {...p} />,
                            ul: (p) => <ul className="list-disc pl-6 space-y-1" {...p} />,
                            ol: (p) => <ol className="list-decimal pl-6 space-y-1" {...p} />,
                            code: ({ className, children, ...rest }: any) =>
                              className?.includes("language-") ? (
                                <code className={`${className} block bg-black/40 rounded-lg p-4 overflow-x-auto text-sm`} {...rest}>{children}</code>
                              ) : (
                                <code className="bg-surface px-1.5 py-0.5 rounded text-sm text-cta" {...rest}>{children}</code>
                              ),
                            pre: (p) => <pre className="overflow-x-auto" {...p} />,
                            table: (p) => <table className="w-full border-collapse my-4 text-sm" {...p} />,
                            th: (p) => <th className="border border-white/10 px-3 py-2 text-left text-text-primary" {...p} />,
                            td: (p) => <td className="border border-white/10 px-3 py-2" {...p} />,
                            img: (p) => <img className="rounded-lg max-w-full" {...p} />,
                          }}
                        >
                          {listing.readme}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass"><CardContent className="p-8 text-center text-text-tertiary">No documentation provided yet.</CardContent></Card>
                )}
              </section>

              {/* Version history */}
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2"><History className="h-5 w-5 text-cta" />Version History</h2>
                {versions.length ? (
                  <div className="space-y-3">
                    {versions.map((v: any) => (
                      <Card key={v.id} className="glass">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-text-primary">{v.version_name || `v${v.version_number}`}</span>
                            <span className="text-xs text-text-tertiary">{new Date(v.created_at).toLocaleDateString()}</span>
                          </div>
                          {v.changelog && <p className="text-sm text-text-secondary whitespace-pre-wrap">{v.changelog}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="glass"><CardContent className="p-8 text-center text-text-tertiary">No published versions yet.</CardContent></Card>
                )}
              </section>

              {/* Reviews */}
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-cta" />Reviews ({reviewCount})</h2>
                {reviewCount ? (
                  <div className="space-y-4">
                    {reviews.map((r: any) => (
                      <Card key={r.id} className="glass">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-primary text-sm font-medium">{r.users?.name?.charAt(0) || "?"}</div>
                            <span className="font-medium text-text-primary">{r.users?.name || "Anonymous"}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-cta text-cta" : "text-text-tertiary"}`} />
                              ))}
                            </div>
                            <span className="text-xs text-text-tertiary ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          {r.comment && <p className="text-text-secondary text-sm pl-11">{r.comment}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="glass">
                    <CardContent className="p-8 text-center">
                      <p className="text-text-secondary mb-1">No reviews yet</p>
                      <p className="text-text-tertiary text-sm">Be the first to review this {listing.type.toLowerCase()}.</p>
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* Details */}
              <Card className="glass">
                <CardHeader><CardTitle className="text-xl text-text-primary">Details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-text-tertiary flex items-center gap-2"><Tag className="h-4 w-4" />Type</span><span className="text-text-primary">{listing.type}</span></div>
                  <div className="flex items-center justify-between"><span className="text-text-tertiary flex items-center gap-2"><Package className="h-4 w-4" />Price</span><span className="text-cta font-bold">{listing.price > 0 ? `$${listing.price}` : "Free"}</span></div>
                  {listing.language && <div className="flex items-center justify-between"><span className="text-text-tertiary flex items-center gap-2"><Code2 className="h-4 w-4" />Language</span><span className="text-text-primary">{listing.language}</span></div>}
                  {listing.license && <div className="flex items-center justify-between"><span className="text-text-tertiary flex items-center gap-2"><Scale className="h-4 w-4" />License</span><span className="text-text-primary">{listing.license}</span></div>}
                  {Array.isArray(listing.tags) && listing.tags.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {listing.tags.map((t: string) => (
                        <Link key={t} href={`/search?query=${encodeURIComponent(t)}`} className="text-xs bg-white/[0.06] text-text-secondary px-2 py-1 rounded hover:text-text-primary transition-colors">#{t}</Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Creator card */}
              {creator && (
                <Card className="glass">
                  <CardHeader><CardTitle className="text-xl text-text-primary">Creator</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Link href={`/creators/${creator.id}`} className="flex items-center gap-3 group">
                      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-cta font-bold text-lg overflow-hidden">
                        {creator.avatar_url ? <img src={creator.avatar_url} alt={creator.name || "Creator"} className="w-full h-full object-cover" /> : (creator.name?.charAt(0) || "?")}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary group-hover:text-cta transition-colors">{creator.name || "Anonymous"}</p>
                        <p className="text-xs text-text-tertiary">Joined {new Date(creator.created_at).toLocaleDateString()}</p>
                      </div>
                    </Link>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div><div className="text-lg font-bold text-text-primary">{stats.products}</div><div className="text-xs text-text-tertiary">Products</div></div>
                      <div><div className="text-lg font-bold text-text-primary">{stats.followerCount}</div><div className="text-xs text-text-tertiary">Followers</div></div>
                      <div><div className="text-lg font-bold text-text-primary">{stats.downloads.toLocaleString()}</div><div className="text-xs text-text-tertiary">Downloads</div></div>
                      <div><div className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">{stats.avgRating.toFixed(1)}<Star className="h-3.5 w-3.5 fill-cta text-cta" /></div><div className="text-xs text-text-tertiary">Avg Rating</div></div>
                    </div>
                    <FollowButton creatorId={creator.id} isAuthenticated={viewer.isAuthenticated} initialIsFollowing={viewer.following} />
                    <Button variant="outline" className="w-full" asChild><Link href={`/creators/${creator.id}`}>View full profile</Link></Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Related */}
          {related.more.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">More from this creator</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.more.map((i: any) => <RelatedCard key={i.id} item={i} />)}</div>
            </section>
          )}
          {related.similar.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Similar {listing.type.toLowerCase()}s</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.similar.map((i: any) => <RelatedCard key={i.id} item={i} />)}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
