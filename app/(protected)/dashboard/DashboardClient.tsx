"use client"

import Link from "next/link"
import {
  Download, Bookmark, Package, TrendingUp, ArrowUpRight, Sparkles,
  Bell, Crown, CheckCircle2, Circle, Search, Star, LayoutGrid,
  DollarSign, Zap, Store, ChevronRight, Activity, BarChart3,
} from "lucide-react"

interface DashboardData {
  userName: string
  userRole: string
  tier: string
  planName: string
  planLimits: { storageGb: number; apiRateLimit: number }
  stats: { downloads: number; bookmarks: number; listings: number; revenue: number }
  recentActivity: any[]
  recentListings: any[]
  notifications: any[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { userName, userRole, tier, planName, stats, recentActivity, recentListings, notifications } = data
  const isCreator = ["CREATOR", "ADMIN", "OWNER"].includes(userRole)
  const firstName = userName?.split(" ")[0] || "there"

  const priorities = [
    stats.listings === 0 && { id: "listing", icon: Package, text: "Create your first listing to start selling", href: "/creator/upload", cta: "Create listing", color: "amber" },
    stats.bookmarks === 0 && { id: "bookmark", icon: Star, text: "Bookmark services you want to explore", href: "/explore", cta: "Browse marketplace", color: "blue" },
    notifications.length > 0 && { id: "notifs", icon: Bell, text: `You have ${notifications.length} unread notification${notifications.length > 1 ? "s" : ""}`, href: "/notifications", cta: "View all", color: "purple" },
    tier === "FREE" && { id: "upgrade", icon: Crown, text: "Upgrade to unlock advanced features and higher limits", href: "/developer/billing", cta: "Upgrade plan", color: "amber" },
  ].filter(Boolean) as { id: string; icon: React.ElementType; text: string; href: string; cta: string; color: string }[]

  const statCards = [
    { label: "Downloads", value: stats.downloads, icon: Download, color: "amber", href: "/purchases" },
    { label: "Bookmarks", value: stats.bookmarks, icon: Bookmark, color: "blue", href: "/bookmarks" },
    { label: "Listings", value: stats.listings, icon: Package, color: "green", href: "/creator/listings" },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "purple", href: "/creator/payouts" },
  ]

  const colorMap: Record<string, string> = {
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
  }

  const aiRecs = [
    isCreator && stats.listings === 0 && { icon: Sparkles, text: "You haven't published a listing yet — reach thousands of buyers today.", cta: "Create listing", href: "/creator/upload" },
    !isCreator && { icon: Star, text: "Explore top-rated AI tools and skills in the marketplace.", cta: "Browse", href: "/explore" },
    tier === "FREE" && { icon: Crown, text: "Unlock priority support and advanced API access with a Pro plan.", cta: "Upgrade", href: "/developer/billing" },
    stats.downloads === 0 && { icon: Download, text: "Download a free skill or template to get started instantly.", cta: "Find free tools", href: "/explore?price=free" },
  ].filter(Boolean) as { icon: React.ElementType; text: string; cta: string; href: string }[]

  return (
    <div className="max-w-7xl mx-auto px-2 py-6 space-y-8">

      {/* ── SECTION 1: Welcome Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName} 👋
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">{planName} Plan</span>
          </div>
          <Link href="/explore" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors text-xs font-medium text-white/60 hover:text-white/90">
            <Search className="h-3.5 w-3.5" />
            Explore
          </Link>
        </div>
      </div>

      {/* ── SECTION 2: Today's Priorities ── */}
      {priorities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">Today's Priorities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {priorities.map((p) => {
              const Icon = p.icon
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  className={`group flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${colorMap[p.color]}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/80 leading-snug mb-2">{p.text}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                      {p.cta} <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Revenue Snapshot ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">Overview</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            const colors = colorMap[card.color]
            return (
              <Link
                key={card.label}
                href={card.href}
                className={`group p-5 rounded-2xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${colors}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-4 w-4 opacity-70" />
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50">{card.label}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── SECTIONS 4 + 5: Activity + AI Recs (two-col) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Activity Feed */}
        <div className="xl:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-white/40" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">Recent Activity</h2>
            </div>
            <Link href="/feed" className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentActivity.length > 0 ? recentActivity.map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="h-7 w-7 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/75 leading-snug truncate">{item.description || item.activity_type}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{timeAgo(item.created_at)}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Activity className="h-10 w-10 text-white/10" />
                <p className="text-sm text-white/30">No activity yet</p>
                <Link href="/explore" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Start exploring →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">AI Recommendations</h2>
          </div>
          <div className="p-4 space-y-3">
            {aiRecs.length > 0 ? aiRecs.map((rec, i) => {
              const Icon = rec.icon
              return (
                <Link
                  key={i}
                  href={rec.href}
                  className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-amber-500/[0.06] hover:border-amber-500/20 transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/65 leading-snug mb-1.5">{rec.text}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400/70 group-hover:text-amber-400 transition-colors">
                      {rec.cta} <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              )
            }) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Sparkles className="h-8 w-8 text-white/10" />
                <p className="text-sm text-white/30">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Marketplace Opportunities ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">Marketplace</h2>
          </div>
          <Link href="/explore" className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium">
            Browse all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentListings.length > 0 ? recentListings.map((listing: any) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-amber-400" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors mt-1" />
              </div>
              <h3 className="text-[13px] font-semibold text-white/85 mb-1 line-clamp-1 group-hover:text-white transition-colors">
                {listing.title}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[12px] font-bold text-amber-400">
                  {listing.price === 0 ? "Free" : `$${listing.price}`}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/25">
                  <Download className="h-3 w-3" />
                  {listing.downloads || 0}
                </span>
              </div>
            </Link>
          )) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <Store className="h-10 w-10 text-white/10" />
              <p className="text-sm text-white/30">Marketplace loading…</p>
              <Link href="/explore" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Browse marketplace →
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
