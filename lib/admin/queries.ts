import { createServiceClient } from "@/lib/supabase/server"

export type AdminOverview = {
  totalUsers: number
  newUsers7d: number
  totalListings: number
  activeListings: number
  pendingListings: number
  totalRevenue: number
  revenue30d: number
  completedSales: number
  refundedCount: number
  activeSubscriptions: number
  mrrEstimate: number
  totalPayouts: number
  pendingPayouts: number
  totalDownloads: number
  openReports: number
  totalAssets: number
  storageBytes: number
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = createServiceClient()
  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString()
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { count: newUsers7d },
    { count: totalListings },
    { count: activeListings },
    { count: pendingListings },
    { data: allCompleted },
    { data: recentCompleted },
    { count: refundedCount },
    { count: activeSubscriptions },
    { data: subs },
    { data: payouts },
    { count: openReports },
    { count: totalAssets },
    { data: assetSizes },
    { count: totalDownloads },
  ] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", d7),
    db.from("listings").select("id", { count: "exact", head: true }),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    db.from("transactions").select("amount, net_amount").eq("status", "COMPLETED"),
    db
      .from("transactions")
      .select("amount, net_amount")
      .eq("status", "COMPLETED")
      .gte("created_at", d30),
    db.from("transactions").select("id", { count: "exact", head: true }).eq("status", "REFUNDED"),
    db.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    db.from("subscriptions").select("tier, status").eq("status", "ACTIVE"),
    db.from("payouts").select("amount, status"),
    db
      .from("moderation_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "OPEN"),
    db.from("assets").select("id", { count: "exact", head: true }),
    db.from("assets").select("file_size"),
    db.from("downloads").select("id", { count: "exact", head: true }),
  ])

  const totalRevenue = (allCompleted ?? []).reduce((s, t) => s + Number(t.amount), 0)
  const revenue30d = (recentCompleted ?? []).reduce((s, t) => s + Number(t.amount), 0)
  const tierMrr: Record<string, number> = {
    FREE: 0,
    STARTER: 9,
    PRO: 29,
    BUSINESS: 99,
    ENTERPRISE: 299,
  }
  const mrrEstimate = (subs ?? []).reduce(
    (s, sub) => s + (tierMrr[sub.tier ?? "FREE"] ?? 0),
    0
  )
  const totalPayouts = (payouts ?? [])
    .filter((p) => p.status === "COMPLETED" || p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0)
  const pendingPayouts = (payouts ?? []).filter(
    (p) => p.status === "PENDING" || p.status === "pending"
  ).length
  const storageBytes = (assetSizes ?? []).reduce((s, a) => s + Number(a.file_size ?? 0), 0)

  return {
    totalUsers: totalUsers ?? 0,
    newUsers7d: newUsers7d ?? 0,
    totalListings: totalListings ?? 0,
    activeListings: activeListings ?? 0,
    pendingListings: pendingListings ?? 0,
    totalRevenue,
    revenue30d,
    completedSales: allCompleted?.length ?? 0,
    refundedCount: refundedCount ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    mrrEstimate,
    totalPayouts,
    pendingPayouts,
    totalDownloads: totalDownloads ?? 0,
    openReports: openReports ?? 0,
    totalAssets: totalAssets ?? 0,
    storageBytes,
  }
}

export async function getRevenueTrend(days = 30) {
  const db = createServiceClient()
  const start = new Date()
  start.setDate(start.getDate() - days)

  const { data } = await db
    .from("transactions")
    .select("amount, created_at")
    .eq("status", "COMPLETED")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: true })

  const buckets: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    buckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of data ?? []) {
    const key = row.created_at?.slice(0, 10)
    if (key && key in buckets) buckets[key] += Number(row.amount)
  }
  return Object.entries(buckets).map(([date, revenue]) => ({ date, revenue }))
}

export async function getSignupTrend(days = 30) {
  const db = createServiceClient()
  const start = new Date()
  start.setDate(start.getDate() - days)

  const { data } = await db
    .from("users")
    .select("created_at")
    .gte("created_at", start.toISOString())

  const buckets: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    buckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of data ?? []) {
    const key = row.created_at?.slice(0, 10)
    if (key && key in buckets) buckets[key] += 1
  }
  return Object.entries(buckets).map(([date, signups]) => ({ date, signups }))
}

export async function getRecentTransactions(limit = 20) {
  const db = createServiceClient()
  const { data } = await db
    .from("transactions")
    .select(
      `
      id, amount, status, type, created_at, stripe_payment_intent_id,
      user:users!transactions_user_id_fkey(id, name, email),
      listing:listings!transactions_listing_id_fkey(id, title)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export type GetAdminUsersOptions = {
  search?: string
  role?: string
  status?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export async function getAdminUsers(options: GetAdminUsersOptions = {}) {
  const { search, role, status, from, to, page = 1, pageSize = 50 } = options
  const db = createServiceClient()

  let q = db
    .from("users")
    .select("id, name, email, role, status, last_active_at, avatar_url, created_at", { count: "exact" })

  if (role && role !== "ALL") q = q.eq("role", role)
  if (status && status !== "ALL") q = q.eq("status", status)
  if (from) q = q.gte("created_at", from)
  if (to) q = q.lte("created_at", to)
  if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  q = q.order("created_at", { ascending: false }).range(start, end)

  const { data, error, count } = await q
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

export async function getAdminUserDetail(userId: string) {
  const db = createServiceClient()
  const [user, subscriptions, transactions, listings, entitlements, creatorAccount] =
    await Promise.all([
      db.from("users").select("*").eq("id", userId).maybeSingle(),
      db.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      db
        .from("transactions")
        .select("id, amount, status, created_at, listing:listings!transactions_listing_id_fkey(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("listings")
        .select("id, title, status, price, downloads")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      db.from("feature_entitlements").select("*").eq("user_id", userId).maybeSingle(),
      db.from("creator_accounts").select("*").eq("user_id", userId).maybeSingle(),
    ])
  return {
    user: user.data,
    subscriptions: subscriptions.data ?? [],
    transactions: transactions.data ?? [],
    listings: listings.data ?? [],
    entitlements: entitlements.data,
    creatorAccount: creatorAccount.data,
  }
}

export async function getAdminListings(status?: string, limit = 100) {
  const db = createServiceClient()
  let q = db
    .from("listings")
    .select(
      `id, title, type, price, status, downloads, views, created_at,
       creator:users!listings_creator_id_fkey(id, name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  if (status && status !== "ALL") q = q.eq("status", status)
  const { data } = await q
  return data ?? []
}

export async function getAdminSubscriptions(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("subscriptions")
    .select(
      `*, user:users!subscriptions_user_id_fkey(id, name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAdminPayouts(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("payouts")
    .select(
      `*, user:users!payouts_user_id_fkey(id, name, email),
       creator:creators!payouts_creator_id_fkey(display_name)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getCreatorAccounts(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("creator_accounts")
    .select(`*, user:users!creator_accounts_user_id_fkey(id, name, email)`)
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAdminAssets(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("assets")
    .select(
      `id, url, type, mime_type, file_size, created_at,
       listing:listings!assets_listing_id_fkey(id, title),
       user:users!assets_user_id_fkey(id, name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getModerationReports(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("moderation_reports")
    .select(
      `*, reporter:users!moderation_reports_reporter_id_fkey(name, email),
       listing:listings!moderation_reports_listing_id_fkey(id, title)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getBillingEvents(limit = 50) {
  const db = createServiceClient()
  const { data } = await db
    .from("billing_events")
    .select(`*, user:users!billing_events_user_id_fkey(name, email)`)
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getStripeEvents(limit = 50) {
  const db = createServiceClient()
  const { data } = await db
    .from("stripe_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getSiteSettings() {
  const db = createServiceClient()
  const { data } = await db.from("site_settings").select("*").limit(1).maybeSingle()
  return data
}

export async function getTopListings(limit = 10) {
  const db = createServiceClient()
  const { data } = await db
    .from("listings")
    .select("id, title, downloads, views, price, status")
    .eq("status", "ACTIVE")
    .order("downloads", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAnalyticsEventCounts() {
  const db = createServiceClient()
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: events }, { count: pageViews }] = await Promise.all([
    db.from("analytics_events").select("event").gte("created_at", d30),
    db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", d30),
  ])
  const counts: Record<string, number> = {}
  for (const e of events ?? []) {
    counts[e.event] = (counts[e.event] ?? 0) + 1
  }
  return { eventCounts: counts, pageViews30d: pageViews ?? 0 }
}

export async function getAdminCategories(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("categories")
    .select("id, name, slug, description, icon, created_at")
    .order("name", { ascending: true })
    .limit(limit)
  return data ?? []
}

export async function getAdminAnnouncements(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("platform_announcements")
    .select("id, title, kind, content, is_active, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAdminProjects(limit = 100) {
  const db = createServiceClient()
  const [sessions, expansions] = await Promise.all([
    db
      .from("architect_sessions")
      .select("id, session_name, phase, confidence, file_count, created_at, updated_at, user_id")
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("workflow_expansions")
      .select("id, title, status, pipeline_progress, file_count, created_at, updated_at, user_id")
      .order("created_at", { ascending: false })
      .limit(limit),
  ])
  return {
    sessions: sessions.data ?? [],
    expansions: expansions.data ?? [],
  }
}

export async function getRecentActivity(limit = 15) {
  const db = createServiceClient()
  const { data } = await db
    .from("analytics_events")
    .select("event, user_id, properties, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAdminUserAuditLogs(userId: string, limit = 50) {
  const db = createServiceClient()
  const { data } = await db
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at, user:users!audit_logs_user_id_fkey(name, email)")
    .eq("entity_id", userId)
    .eq("entity_type", "user")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAdminAuditLogs(limit = 100) {
  const db = createServiceClient()
  const { data } = await db
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at, user:users!audit_logs_user_id_fkey(name, email)")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
