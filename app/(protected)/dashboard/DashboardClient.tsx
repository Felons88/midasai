"use client"

import Link from "next/link"
import {
  Download, Bookmark, Package, TrendingUp, ArrowUpRight, Sparkles,
  Crown, CheckCircle2, DollarSign, Zap, Store, ChevronRight,
  Activity, BarChart3, Eye, Users, Key, Webhook,
  Server, Database, Plus, Settings, Star,
  MessageSquare, ShoppingBag
} from "lucide-react"

interface DashboardData {
  userName: string
  userRole: string
  tier: string
  planName: string
  planLimits: { storageGb: number; apiRateLimit: number }
  billing: { periodEnd: string | null; periodStart: string | null; status: string }
  stats: {
    downloads: number; downloadsLast30: number
    bookmarks: number; listings: number
    revenue: number; revenueLast30: number
    views: number; followers: number; conversion: number
  }
  usage: {
    apiRequests: number; apiRequestLimit: number
    storageUsed: number; storageLimit: number
    apiKeys: number; apiKeyLimit: number
    webhooks: number; webhookLimit: number
    mcpServers: number; mcpLimit: number
  }
  recentActivity: any[]
  marketplaceListings: any[]
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

function UsageBar({ used, limit, label, icon: Icon, color = "amber" }: {
  used: number; limit: number; label: string; icon: React.ElementType; color?: string
}) {
  const pct = limit <= 0 ? 0 : Math.min(Math.round((used / limit) * 100), 100)
  const isUnlimited = limit === -1
  const colorClass = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : color === "blue" ? "bg-blue-500" : color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/60">{label}</span>
          <span className={`text-xs font-semibold tabular-nums ${pct >= 90 ? "text-red-400" : "text-white/50"}`}>
            {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
            {!isUnlimited && <span className="text-white/30 font-normal ml-1">{pct}%</span>}
          </span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: isUnlimited ? "0%" : `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function Sparkline({ positive = true }: { positive?: boolean }) {
  const h = positive
    ? [2, 4, 3, 5, 4, 6, 5, 7, 6, 8]
    : [8, 6, 7, 5, 6, 4, 5, 3, 4, 2]
  const max = Math.max(...h)
  const pts = h.map((v, i) => `${(i / (h.length - 1)) * 56},${12 - (v / max) * 10}`).join(" ")
  return (
    <svg width="56" height="14" viewBox="0 0 56 14" fill="none" className="opacity-70">
      <polyline points={pts} stroke={positive ? "#f59e0b" : "#ef4444"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { userName, userRole, tier, planName, stats, usage, billing, recentActivity, marketplaceListings } = data
  const isCreator = ["CREATOR", "ADMIN", "OWNER"].includes(userRole)
  const firstName = userName?.split(" ")[0] || "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const tierColor: Record<string, string> = {
    FREE: "text-white/50", STARTER: "text-blue-400", PRO: "text-amber-400", BUSINESS: "text-purple-400"
  }
  const tierBg: Record<string, string> = {
    FREE: "bg-white/[0.04] border-white/[0.08]", STARTER: "bg-blue-500/10 border-blue-500/20",
    PRO: "bg-amber-500/10 border-amber-500/20", BUSINESS: "bg-purple-500/10 border-purple-500/20"
  }

  // ── Quick actions ──
  const quickActions = [
    { label: "New Listing", href: "/creator/upload", icon: Plus },
    { label: "Create MCP", href: "/creator/mcp-servers", icon: Server },
    { label: "API Key", href: "/developer/keys", icon: Key },
    { label: "Webhook", href: "/developer/webhooks", icon: Webhook },
    { label: "Settings", href: "/settings", icon: Settings },
  ]

  // ── Metric cards (Row 1) ──
  const metricCards = [
    { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, sub: `${stats.revenueLast30 > 0 ? "+" : ""}$${stats.revenueLast30.toFixed(2)} last 30d`, icon: DollarSign, color: "text-emerald-400", positive: stats.revenueLast30 >= 0 },
    { label: "Downloads", value: stats.downloads.toLocaleString(), sub: `${stats.downloadsLast30} last 30d`, icon: Download, color: "text-blue-400", positive: true },
    { label: "Active Listings", value: stats.listings.toLocaleString(), sub: isCreator ? "Published" : "Saved", icon: Package, color: "text-amber-400", positive: true },
    { label: "Profile Views", value: stats.views.toLocaleString(), sub: "Last 30 days", icon: Eye, color: "text-purple-400", positive: true },
    { label: "Conversion", value: `${stats.conversion}%`, sub: "Downloads / views", icon: TrendingUp, color: "text-cyan-400", positive: true },
    { label: "Bookmarks", value: stats.bookmarks.toLocaleString(), sub: "Saved items", icon: Bookmark, color: "text-pink-400", positive: true },
    { label: "Followers", value: stats.followers.toLocaleString(), sub: "Subscribers", icon: Users, color: "text-indigo-400", positive: true },
  ]

  // ── Priorities ──
  const priorities = [
    stats.listings === 0 && isCreator && { icon: Package, text: "Create your first listing", desc: "Start selling to thousands of buyers", href: "/creator/upload", cta: "Create", priority: "high" },
    stats.listings === 0 && !isCreator && { icon: Store, text: "Explore the marketplace", desc: "Find tools and services for your business", href: "/explore", cta: "Explore", priority: "medium" },
    tier === "FREE" && { icon: Crown, text: "Upgrade your plan", desc: "Unlock higher limits and advanced features", href: "/developer/billing", cta: "Upgrade", priority: "medium" },
    usage.apiKeys === 0 && { icon: Key, text: "Create an API key", desc: "Start building integrations with MidasAI", href: "/developer/keys", cta: "Create", priority: "low" },
  ].filter(Boolean) as { icon: React.ElementType; text: string; desc: string; href: string; cta: string; priority: string }[]

  // ── AI recs ──
  const aiRecs = [
    isCreator && stats.listings === 0 && { icon: Sparkles, text: "Create your first listing", desc: "Start selling your services or product", cta: "Get started", href: "/creator/upload" },
    tier === "FREE" && { icon: Crown, text: "Unlock advanced features", desc: "Upgrade to Pro for advanced analytics and tools", cta: "Upgrade now", href: "/developer/billing" },
    usage.webhooks === 0 && { icon: Webhook, text: "Set up automations", desc: "Save time by automating your workflow", cta: "Explore automations", href: "/developer/webhooks" },
    !isCreator && { icon: Star, text: "Complete your profile", desc: "Increase trust by completing your profile", cta: "Update profile", href: "/settings/profile" },
  ].filter(Boolean) as { icon: React.ElementType; text: string; desc: string; cta: string; href: string }[]

  const activityIcons: Record<string, React.ElementType> = {
    download: Download, purchase: ShoppingBag, review: Star, listing: Package,
    follow: Users, message: MessageSquare, payout: DollarSign, webhook: Webhook,
    default: Activity,
  }

  return (
    <div className="px-6 py-5 space-y-5 max-w-[1440px] mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/developer/billing"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${tierBg[tier] || tierBg.FREE} ${tierColor[tier] || "text-white/50"} hover:opacity-90 transition-opacity`}>
            <Crown className="h-3 w-3" />{planName} Plan
          </Link>
          <Link href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
            <Store className="h-3 w-3" />Explore
          </Link>
        </div>
      </div>

      {/* ── ROW 1: BUSINESS METRICS (8 compact cards) ── */}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label}
              className="group p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-default">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                <Sparkline positive={card.positive} />
              </div>
              <p className="text-[15px] font-bold text-white leading-none mb-0.5">{card.value}</p>
              <p className="text-[10px] text-white/40 leading-tight truncate">{card.label}</p>
              <p className="text-[10px] text-white/25 mt-0.5 truncate">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mr-1">Quick Actions</span>
        {quickActions.map((qa) => {
          const Icon = qa.icon
          return (
            <Link key={qa.label} href={qa.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 text-xs text-white/50 transition-all">
              <Icon className="h-3 w-3" />{qa.label}
            </Link>
          )
        })}
      </div>

      {/* ── ROW 2: ACTION CENTER ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Today's Priorities — 3 cols */}
        <div className="xl:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Today&apos;s Priorities</h2>
            </div>
            <span className="text-[10px] text-white/30">{priorities.length} / {priorities.length} tasks</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {priorities.length > 0 ? priorities.map((p, i) => {
              const Icon = p.icon
              const priColor = p.priority === "high" ? "text-red-400 bg-red-500/10" : p.priority === "medium" ? "text-amber-400 bg-amber-500/10" : "text-white/30 bg-white/[0.04]"
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${priColor}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/80 leading-none mb-0.5">{p.text}</p>
                    <p className="text-[11px] text-white/35 truncate">{p.desc}</p>
                  </div>
                  <Link href={p.href}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[11px] font-bold hover:bg-amber-400 transition-colors">
                    {p.cta}
                  </Link>
                </div>
              )
            }) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/30" />
                <p className="text-sm text-white/30">All priorities complete!</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations — 2 cols */}
        <div className="xl:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest">AI Recommendations</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {aiRecs.length > 0 ? aiRecs.map((rec, i) => {
              const Icon = rec.icon
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white/80 leading-none mb-0.5">{rec.text}</p>
                    <p className="text-[11px] text-white/35 mb-1.5 leading-snug">{rec.desc}</p>
                    <Link href={rec.href} className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5">
                      {rec.cta} <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )
            }) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-8 w-8 text-white/10 mb-2" />
                <p className="text-xs text-white/30">No recommendations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ANALYTICS + USAGE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Analytics Overview — 3 cols */}
        <div className="xl:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-white/40" />
              <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Analytics Overview</h2>
            </div>
            <span className="text-[10px] text-amber-400/70 font-medium">Last 30 days</span>
          </div>
          <div className="p-4">
            {/* Summary metrics row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Revenue", value: `$${stats.revenueLast30.toFixed(2)}`, trend: "—" },
                { label: "Downloads", value: stats.downloadsLast30, trend: "—" },
                { label: "Views", value: stats.views, trend: "—" },
                { label: "Conversion", value: `${stats.conversion}%`, trend: "—" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[11px] text-white/35 mb-1">{m.label}</p>
                  <p className="text-base font-bold text-white">{m.value}</p>
                  <p className="text-[10px] text-white/25">{m.trend}</p>
                </div>
              ))}
            </div>
            {/* Chart placeholder — bar chart style */}
            <div className="h-[90px] flex items-end gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const h = Math.max(4, Math.round(Math.random() * 80 + 10))
                return (
                  <div key={i} className="flex-1 rounded-sm bg-amber-500/20 hover:bg-amber-500/40 transition-colors" style={{ height: `${h}%` }} />
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-white/20">{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span className="text-[10px] text-white/20">Today</span>
            </div>
          </div>
        </div>

        {/* Usage Overview — 2 cols */}
        <div className="xl:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-white/40" />
              <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Usage Overview</h2>
            </div>
            <Link href="/developer/billing" className="text-[10px] text-amber-400/70 hover:text-amber-400 font-medium transition-colors flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-4 py-2">
            <UsageBar used={usage.apiRequests} limit={usage.apiRequestLimit} label="API Requests" icon={Zap} color="amber" />
            <UsageBar used={usage.storageUsed} limit={usage.storageLimit} label={`Storage (${usage.storageLimit}GB limit)`} icon={Database} color="blue" />
            <UsageBar used={usage.apiKeys} limit={usage.apiKeyLimit} label="API Keys" icon={Key} color="emerald" />
            <UsageBar used={usage.webhooks} limit={usage.webhookLimit} label="Webhooks" icon={Webhook} color="amber" />
            <UsageBar used={usage.mcpServers} limit={usage.mcpLimit} label="MCP Servers" icon={Server} color="purple" />
          </div>
          {tier === "FREE" && (
            <div className="px-4 pb-3 pt-1">
              <Link href="/developer/billing"
                className="w-full flex items-center justify-center gap-2 h-8 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors">
                <Crown className="h-3 w-3" /> Upgrade Plan
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 4: ACTIVITY FEED ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-white/40" />
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Recent Activity</h2>
          </div>
          <Link href="/feed" className="flex items-center gap-0.5 text-[10px] text-amber-400/70 hover:text-amber-400 font-medium transition-colors">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[280px] overflow-y-auto">
          {recentActivity.length > 0 ? recentActivity.map((item: any) => {
            const eventType = (item.event_type || item.activity_type || "default").toLowerCase()
            const Icon = activityIcons[eventType] || activityIcons.default
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                <div className="h-7 w-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3 w-3 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/70 truncate leading-none mb-0.5">
                    {item.description || item.entity_title || item.activity_type || "Activity"}
                  </p>
                  <p className="text-[10px] text-white/25">{timeAgo(item.created_at)}</p>
                </div>
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Activity className="h-8 w-8 text-white/10" />
              <p className="text-xs text-white/30">No activity yet</p>
              <Link href="/explore" className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors">Start exploring →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 5: PLAN & BILLING (compact strip) ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tierBg[tier] || "bg-white/[0.04] border-white/[0.08]"}`}>
            <Crown className={`h-4 w-4 ${tierColor[tier] || "text-white/40"}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{planName} Plan</p>
            <p className="text-[10px] text-white/35 mt-0.5">
              {tier === "FREE" ? "$0 / month" : tier === "STARTER" ? "$29 / month" : tier === "PRO" ? "$79 / month" : "$199 / month"}
            </p>
          </div>
        </div>
        <div className="hidden sm:block h-6 w-px bg-white/[0.06]" />
        <div className="grid grid-cols-3 gap-6 flex-1 text-center">
          <div>
            <p className="text-[10px] text-white/30 mb-0.5">Current period</p>
            <p className="text-[11px] text-white/60">
              {billing.periodStart ? new Date(billing.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} –{" "}
              {billing.periodEnd ? new Date(billing.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/30 mb-0.5">Next billing date</p>
            <p className="text-[11px] text-white/60">
              {billing.periodEnd ? new Date(billing.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/30 mb-0.5">Payment method</p>
            <p className="text-[11px] text-white/60">
              {billing.status === "FREE" ? "No payment method" : "Managed via Stripe"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tier === "FREE" && (
            <Link href="/developer/billing"
              className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors">
              Upgrade Plan
            </Link>
          )}
          <Link href="/developer/billing"
            className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs text-white/60 hover:text-white hover:border-white/20 transition-all">
            Manage Billing
          </Link>
        </div>
      </div>

      {/* ── ROW 6: MARKETPLACE SPOTLIGHT ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-white/40" />
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Marketplace Spotlight</h2>
          </div>
          <Link href="/explore" className="flex items-center gap-0.5 text-[10px] text-amber-400/70 hover:text-amber-400 font-medium transition-colors">
            Browse all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {marketplaceListings.length > 0 ? marketplaceListings.map((listing: any) => (
            <Link key={listing.id} href={`/listing/${listing.id}`}
              className="group p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/10 flex items-center justify-center mb-2.5">
                <Package className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-[11px] font-semibold text-white/80 line-clamp-2 mb-1.5 leading-snug group-hover:text-white transition-colors">{listing.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400">{listing.price === 0 ? "Free" : `$${listing.price}`}</span>
                {listing.average_rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/30">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {listing.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Download className="h-2.5 w-2.5 text-white/20" />
                <span className="text-[10px] text-white/25">{listing.downloads || 0}</span>
              </div>
            </Link>
          )) : (
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] flex flex-col gap-2">
                <div className="h-9 w-9 rounded-lg bg-white/[0.03] animate-pulse" />
                <div className="h-3 w-full rounded bg-white/[0.03] animate-pulse" />
                <div className="h-2.5 w-2/3 rounded bg-white/[0.03] animate-pulse" />
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
