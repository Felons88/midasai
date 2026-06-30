import { Button } from "@/components/ui/button"
import {
  Upload,
  DollarSign,
  Package,
  TrendingUp,
  Eye,
  ArrowUpRight,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { fetchCreatorTransactions, summarizeTransactions } from "@/lib/creator/revenue"

async function getCreatorStats(userId: string) {
  const supabase = await createClient()
  const transactions = await fetchCreatorTransactions(supabase, userId)
  const summary = summarizeTransactions(transactions)
  const completed = transactions.filter((t) => t.status === "COMPLETED")

  const { data: listings } = await supabase
    .from("listings")
    .select("downloads, views, status")
    .eq("creator_id", userId)

  const totalDownloads = listings?.reduce((s, l) => s + (l.downloads ?? 0), 0) ?? 0
  const totalViews = listings?.reduce((s, l) => s + (l.views ?? 0), 0) ?? 0
  const activeListings = listings?.filter((l) => l.status === "ACTIVE").length ?? 0
  const conversionRate =
    totalViews > 0 ? ((completed.length / totalViews) * 100).toFixed(1) : "0.0"

  return {
    revenue: summary.grossRevenue,
    sales: completed.length,
    downloads: totalDownloads,
    views: totalViews,
    activeListings,
    conversionRate,
  }
}

async function getRecentSales(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("transactions")
    .select("id, amount, created_at, listings(title)")
    .eq("creator_id", userId)
    .eq("status", "COMPLETED")
    .order("created_at", { ascending: false })
    .limit(6)
  return data ?? []
}

async function getTopListings(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("listings")
    .select("id, title, type, status, downloads, price")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(8)
  return data ?? []
}

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-text-secondary">
        Please log in to view your creator dashboard.
      </div>
    )
  }

  const [stats, recentSales, listings] = await Promise.all([
    getCreatorStats(user.id),
    getRecentSales(user.id),
    getTopListings(user.id),
  ])

  const quickLinks = [
    { href: "/creator/upload", label: "Upload", icon: Upload },
    { href: "/creator/listings", label: "Listings", icon: Package },
    { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/creator/payouts", label: "Payouts", icon: DollarSign },
  ]

  return (
    <div className="p-5 lg:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Creator studio</h1>
          <p className="text-sm text-text-secondary">
            {stats.activeListings} active listing{stats.activeListings === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild size="sm" className="shadow-glow">
          <Link href="/creator/upload">
            <Upload className="h-4 w-4 mr-1.5" />
            New listing
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, accent: true },
          { label: "Sales", value: String(stats.sales) },
          { label: "Downloads", value: stats.downloads.toLocaleString() },
          { label: "Conversion", value: `${stats.conversionRate}%` },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border/60 bg-surface/50 px-3 py-2.5"
          >
            <p
              className={`text-lg font-semibold leading-tight ${
                m.accent ? "text-cta" : "text-text-primary"
              }`}
            >
              {m.value}
            </p>
            <p className="text-xs text-text-tertiary">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Button key={link.href} variant="outline" size="sm" asChild className="h-8">
            <Link href={link.href}>
              <link.icon className="h-3.5 w-3.5 mr-1.5" />
              {link.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <section className="lg:col-span-3 rounded-xl border border-border/60 bg-surface/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h2 className="text-sm font-medium text-text-primary">Your listings</h2>
            <Link
              href="/creator/listings"
              className="text-xs text-cta hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/30">
            {listings.length === 0 ? (
              <p className="px-4 py-8 text-sm text-text-tertiary text-center">
                No listings yet.{" "}
                <Link href="/creator/upload" className="text-cta hover:underline">
                  Upload your first
                </Link>
              </p>
            ) : (
              listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/creator/listings/${listing.id}/edit`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {listing.type} · {listing.status}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-text-primary">
                      {listing.price != null && Number(listing.price) > 0
                        ? `$${listing.price}`
                        : "Free"}
                    </p>
                    <p className="text-xs text-text-tertiary flex items-center justify-end gap-1">
                      <Eye className="h-3 w-3" />
                      {listing.downloads ?? 0}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-2 rounded-xl border border-border/60 bg-surface/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h2 className="text-sm font-medium text-text-primary">Recent sales</h2>
            <TrendingUp className="h-4 w-4 text-text-tertiary" />
          </div>
          <div className="divide-y divide-border/30">
            {recentSales.length === 0 ? (
              <p className="px-4 py-8 text-sm text-text-tertiary text-center">No sales yet.</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {(sale.listings as { title?: string } | null)?.title ?? "Sale"}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-cta shrink-0">+${sale.amount}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
