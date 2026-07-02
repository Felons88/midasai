import type { Metadata } from "next"
import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/server"
import { CreatorCard, type CreatorItem } from "@/components/homepage/CreatorCard"
import { SectionHeader } from "@/components/homepage/SectionHeader"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Top Creators | MidasAI",
  description: "Discover the top creators building AI skills, agents, workflows, and templates on MidasAI.",
}

export const revalidate = 60

async function getCreators(): Promise<CreatorItem[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from("creators")
      .select(
        "user_id, verified, total_revenue, followers_count, avatar_url, users!creators_user_id_fkey(name, avatar_url), listings:users!creators_user_id_fkey(listings(title, downloads, average_rating))"
      )
      .eq("verified", true)
      .order("total_revenue", { ascending: false, nullsFirst: false })
      .limit(32)

    return ((data ?? []) as any[]).map((c) => {
      const listingsArr = Array.isArray(c.listings) ? c.listings : []
      const totalDownloads = listingsArr.reduce((sum: number, l: any) => sum + (l.downloads ?? 0), 0)
      const ratings = listingsArr
        .filter((l: any) => (l.average_rating ?? 0) > 0)
        .map((l: any) => l.average_rating as number)
      const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
      return {
        id: c.user_id,
        name: c.users?.name ?? null,
        slug: null,
        avatar_url: c.avatar_url ?? c.users?.avatar_url ?? null,
        verified: c.verified ?? false,
        listingCount: listingsArr.length,
        totalDownloads,
        totalRating: avgRating,
        featuredListing: listingsArr[0]?.title ?? null,
      }
    })
  } catch (error) {
    console.error("Creators page error:", error)
    return []
  }
}

export default async function CreatorsPage() {
  const creators = await getCreators()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              badge="Creators"
              title="Meet the builders"
              description="The creators behind the most installed AI skills, agents, workflows, and templates on MidasAI."
            />

            {creators.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-white/10 bg-surface/40">
                <div className="w-16 h-16 rounded-2xl bg-cta/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-cta" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No verified creators yet</h3>
                <p className="text-text-secondary max-w-md mx-auto mb-6">
                  Verified creators will appear here once listings start publishing. You can be the first.
                </p>
                <Link
                  href="/creator/upload"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-cta text-primary-foreground font-semibold hover:bg-cta-light transition-smooth"
                >
                  Become a Creator
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {creators.map((creator, index) => (
                  <CreatorCard key={creator.id} creator={creator} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
