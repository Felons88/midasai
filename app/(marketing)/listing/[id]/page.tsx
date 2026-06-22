import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Heart,
  PackageCheck,
  Share2,
  Star,
  Tags,
  Terminal,
  User,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"

type CreatorProfile = {
  id?: string
  name?: string | null
  avatar_url?: string | null
  display_name?: string | null
  slug?: string | null
  bio?: string | null
  verified?: boolean | null
  total_listings?: number | null
}

type ReadmeSections = {
  overview?: string
  installation?: string
  usage?: string
  features?: string
}

const sectionAliases = {
  overview: ["overview", "about", "description", "introduction", "summary"],
  installation: ["installation", "install", "setup", "getting started", "quick start", "quickstart"],
  usage: ["usage", "how to use", "examples", "example", "configuration", "docs", "documentation"],
  features: ["features", "key features", "capabilities", "what it does", "included"],
}

function getListingClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServiceClient()
  }

  return null
}

function cleanHeading(heading: string) {
  return heading
    .replace(/[#*_`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function getSectionKey(heading: string): keyof ReadmeSections | null {
  const normalized = cleanHeading(heading)

  for (const [key, aliases] of Object.entries(sectionAliases)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
      return key as keyof ReadmeSections
    }
  }

  return null
}

function cleanReadmeText(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}

function truncateSection(value: string, limit = 1800) {
  const cleaned = cleanReadmeText(value)

  if (cleaned.length <= limit) {
    return cleaned
  }

  return `${cleaned.slice(0, limit).trim()}...`
}

function getIntroFromReadme(readme: string) {
  const lines = cleanReadmeText(readme)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim()
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("!") &&
        !trimmed.startsWith("[!") &&
        !trimmed.match(/^\[.*\]\(.*\)$/)
      )
    })

  return truncateSection(lines.slice(0, 8).join("\n"), 1200)
}

function extractReadmeSections(readme?: string | null): ReadmeSections {
  if (!readme) return {}

  const sections: ReadmeSections = {}
  const lines = cleanReadmeText(readme).split("\n")
  let currentKey: keyof ReadmeSections | null = null
  let buffer: string[] = []

  const commitBuffer = () => {
    if (currentKey && buffer.length > 0 && !sections[currentKey]) {
      sections[currentKey] = truncateSection(buffer.join("\n"))
    }
    buffer = []
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s+(.+?)\s*#*\s*$/)

    if (headingMatch) {
      const nextKey = getSectionKey(headingMatch[1])

      if (nextKey) {
        commitBuffer()
        currentKey = nextKey
        continue
      }

      if (currentKey) {
        commitBuffer()
        currentKey = null
      }
    }

    if (currentKey) {
      buffer.push(line)
    }
  }

  commitBuffer()

  if (!sections.overview) {
    sections.overview = getIntroFromReadme(readme)
  }

  return sections
}

function splitTags(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : []
}

async function getListing(id: string) {
  try {
    const privilegedClient = getListingClient()
    const supabase = privilegedClient || await createClient()

    const { data: listing, error } = await supabase
      .from("listings")
      .select(`
        *,
        categories(name, slug),
        reviews(id, rating, comment, created_at, users!reviews_user_id_fkey(id, name, avatar_url))
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching listing:", error)
      return null
    }

    const [userResult, creatorResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, avatar_url")
        .eq("id", listing.creator_id)
        .maybeSingle(),
      supabase
        .from("creators")
        .select("id, user_id, display_name, name, avatar_url, slug, bio, verified, total_listings")
        .eq("user_id", listing.creator_id)
        .maybeSingle(),
    ])

    if (userResult.error) {
      console.error("Error fetching listing creator user:", userResult.error)
    }

    if (creatorResult.error) {
      console.error("Error fetching listing creator profile:", creatorResult.error)
    }

    const creator: CreatorProfile = {
      ...userResult.data,
      ...creatorResult.data,
      name: creatorResult.data?.display_name || creatorResult.data?.name || userResult.data?.name,
      avatar_url: creatorResult.data?.avatar_url || userResult.data?.avatar_url,
    }

    return { ...listing, creator }
  } catch (error) {
    console.error("Error in getListing:", error)
    return null
  }
}

async function getCreatorListingCount(creatorId: string, providedCount?: number | null) {
  if (typeof providedCount === "number") {
    return providedCount
  }

  try {
    const supabase = getListingClient() || await createClient()
    const { count, error } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("status", "ACTIVE")

    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-text-tertiary">{label}</span>
      <div className="min-w-0 text-right text-sm font-medium text-text-primary">{children}</div>
    </div>
  )
}

function DocumentationBlock({
  icon: Icon,
  title,
  content,
  empty,
}: {
  icon: React.ElementType
  title: string
  content?: string
  empty: string
}) {
  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl text-text-primary">
          <Icon className="h-5 w-5 text-cta" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary sm:text-base">
            {content}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-text-tertiary">
            {empty}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    notFound()
  }

  const creator = listing.creator as CreatorProfile
  const creatorName = creator?.name || "MidasAI Creator"
  const creatorListingCount = await getCreatorListingCount(listing.creator_id, creator?.total_listings)
  const readmeSections = extractReadmeSections(listing.readme)
  const tags = splitTags(listing.tags)
  const topics = splitTags(listing.topics)
  const allTags = Array.from(new Set([...tags, ...topics])).slice(0, 14)

  const avgRating = listing.reviews?.length > 0
    ? listing.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / listing.reviews.length
    : Number(listing.average_rating || 0)
  const reviewCount = listing.reviews?.length || listing.review_count || 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container relative mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <Button variant="outline" className="mb-6 transition-smooth sm:mb-8" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 animate-fade-in-up lg:col-span-2">
              <section className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cta/20 bg-cta/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cta">
                    {listing.type}
                  </span>
                  {listing.categories?.name && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-secondary">
                      {listing.categories.name}
                    </span>
                  )}
                  {listing.language && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-secondary">
                      {listing.language}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="mb-3 break-words text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
                    {listing.title}
                  </h1>
                  <p className="text-base leading-8 text-text-secondary sm:text-xl">{listing.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-surface text-xs font-bold text-cta">
                      {creator?.avatar_url ? (
                        <img src={creator.avatar_url} alt={creatorName} className="h-full w-full object-cover" />
                      ) : (
                        creatorName.charAt(0)
                      )}
                    </div>
                    <span>
                      Created by <span className="font-semibold text-text-primary">{creatorName}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-cta text-cta" />
                    <span className="text-text-primary">{avgRating.toFixed(1)}</span>
                    <span>({reviewCount} reviews)</span>
                  </div>
                </div>
              </section>

              <Card className="glass">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-surface">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      <div className="text-center">
                        <PackageCheck className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
                        <span className="text-sm text-text-tertiary">No preview available</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button className="h-12 flex-1 text-base shadow-glow">
                      <Download className="mr-2 h-5 w-5" />
                      {listing.price > 0 ? `Purchase - $${listing.price}` : "Download Free"}
                    </Button>
                    {listing.github_url && (
                      <Button variant="outline" className="h-12 flex-1 transition-smooth sm:flex-none" asChild>
                        <Link href={listing.github_url} target="_blank" rel="noreferrer">
                          <Github className="mr-2 h-5 w-5" />
                          View Source
                        </Link>
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-3 sm:flex">
                      <Button variant="outline" size="icon" className="h-12 w-full transition-smooth sm:w-12" aria-label="Save listing">
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-full transition-smooth sm:w-12" aria-label="Share listing">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <DocumentationBlock
                icon={BookOpen}
                title="Overview"
                content={readmeSections.overview || listing.description}
                empty="No overview content has been added for this listing yet."
              />

              <DocumentationBlock
                icon={Terminal}
                title="Installation"
                content={readmeSections.installation}
                empty="No installation instructions were found in the uploaded README."
              />

              <DocumentationBlock
                icon={Code2}
                title="Usage"
                content={readmeSections.usage}
                empty="No usage examples were found in the uploaded README."
              />

              <DocumentationBlock
                icon={FileText}
                title="Features"
                content={readmeSections.features}
                empty="No feature section was found in the uploaded README."
              />

              {allTags.length > 0 && (
                <Card className="glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl text-text-primary">
                      <Tags className="h-5 w-5 text-cta" />
                      Tags & Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {listing.reviews && listing.reviews.length > 0 && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-2xl text-text-primary">Reviews ({reviewCount})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {listing.reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-medium text-text-primary">
                            {review.users?.avatar_url ? (
                              <img src={review.users.avatar_url} alt={review.users?.name || "Reviewer"} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              review.users?.name?.charAt(0) || "?"
                            )}
                          </div>
                          <span className="font-medium text-text-primary">{review.users?.name || "Anonymous"}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-cta text-cta" : "text-text-tertiary"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-text-tertiary sm:ml-auto">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-text-secondary sm:pl-11">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Card className="glass lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DetailRow label="Type">{listing.type}</DetailRow>
                  {listing.categories?.name && <DetailRow label="Category">{listing.categories.name}</DetailRow>}
                  <DetailRow label="Price">
                    <span className="text-lg font-bold text-cta">{listing.price > 0 ? `$${listing.price}` : "Free"}</span>
                  </DetailRow>
                  <DetailRow label="Downloads">
                    <span className="inline-flex items-center gap-1.5">
                      <Download className="h-4 w-4" />
                      {listing.downloads || 0}
                    </span>
                  </DetailRow>
                  <DetailRow label="Views">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {listing.views || 0}
                    </span>
                  </DetailRow>
                  <DetailRow label="Rating">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-cta text-cta" />
                      {avgRating.toFixed(1)} ({reviewCount})
                    </span>
                  </DetailRow>
                  {listing.language && <DetailRow label="Language">{listing.language}</DetailRow>}
                  {listing.license && <DetailRow label="License">{listing.license}</DetailRow>}
                  {listing.github_url && (
                    <DetailRow label="Source">
                      <Link href={listing.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cta hover:underline">
                        GitHub
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </DetailRow>
                  )}
                  <DetailRow label="Updated">{new Date(listing.updated_at).toLocaleDateString()}</DetailRow>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">Creator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface text-lg font-bold text-cta">
                      {creator?.avatar_url ? (
                        <img src={creator.avatar_url} alt={creatorName} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">{creatorName}</p>
                      <p className="text-sm text-text-tertiary">
                        {creatorListingCount} {creatorListingCount === 1 ? "listing" : "listings"}
                      </p>
                    </div>
                  </div>
                  {creator?.bio && <p className="text-sm leading-6 text-text-secondary">{creator.bio}</p>}
                  {creator?.slug && (
                    <Button variant="outline" className="w-full transition-smooth" asChild>
                      <Link href={`/creators/${creator.slug}`}>View creator profile</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
