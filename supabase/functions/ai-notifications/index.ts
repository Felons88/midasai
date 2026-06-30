import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// ── Notification templates ──────────────────────────────────────────────────
interface NotifTemplate {
  type: string
  title: string
  body: (ctx: Record<string, unknown>) => string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  action_url?: string
  action_label?: string
  icon_name?: string
  cooldown_hours: number // don't re-send within this window
}

const TEMPLATES: Record<string, NotifTemplate> = {
  usage_80pct: {
    type: "SYSTEM",
    title: "You're at 80% of your API limit",
    body: (c) => `You've used ${c.used} of ${c.limit} API requests this month. Consider upgrading to avoid hitting your limit.`,
    priority: "HIGH",
    action_url: "/developer/billing",
    action_label: "Upgrade Plan",
    icon_name: "Zap",
    cooldown_hours: 24,
  },
  usage_95pct: {
    type: "SYSTEM",
    title: "API limit almost reached",
    body: (c) => `You've used ${c.pct}% of your monthly API quota. Upgrade now to avoid interruptions.`,
    priority: "URGENT",
    action_url: "/developer/billing",
    action_label: "Upgrade Now",
    icon_name: "AlertTriangle",
    cooldown_hours: 12,
  },
  storage_80pct: {
    type: "SYSTEM",
    title: "Storage at 80%",
    body: (c) => `You're using ${c.used} GB of ${c.limit} GB. Clean up old assets or upgrade for more space.`,
    priority: "NORMAL",
    action_url: "/developer/billing",
    action_label: "Upgrade Storage",
    icon_name: "HardDrive",
    cooldown_hours: 48,
  },
  upgrade_social_proof: {
    type: "PROMOTIONS",
    title: "Creators on Pro earn 3× more",
    body: () => "Upgrade to Pro and reduce your platform fee to 8%. Most active creators recoup the cost within their first sale.",
    priority: "NORMAL",
    action_url: "/developer/billing",
    action_label: "See Pro Benefits",
    icon_name: "TrendingUp",
    cooldown_hours: 168, // 1 week
  },
  retention_inactive_7d: {
    type: "AI_ASSISTANT",
    title: "Pick up where you left off",
    body: (c) => `Hi ${c.name || "there"} — you haven't created a listing in 7 days. Your audience is waiting.`,
    priority: "NORMAL",
    action_url: "/creator/upload",
    action_label: "Create Listing",
    icon_name: "Sparkles",
    cooldown_hours: 72,
  },
  annual_discount: {
    type: "PROMOTIONS",
    title: "Save 17% — switch to annual billing",
    body: (c) => `Switch your ${c.tier} plan to annual and save $${c.savings}/year instantly.`,
    priority: "NORMAL",
    action_url: "/developer/billing",
    action_label: "Switch to Annual",
    icon_name: "Gift",
    cooldown_hours: 168,
  },
  listing_published_tips: {
    type: "MARKETPLACE",
    title: "Boost your listing visibility",
    body: (c) => `"${c.title}" was just published. Add tags, a demo video, and featured slot to increase downloads by 5×.`,
    priority: "LOW",
    action_url: "/creator/dashboard",
    action_label: "Optimize Listing",
    icon_name: "Star",
    cooldown_hours: 0, // once per listing
  },
  first_sale: {
    type: "MARKETPLACE",
    title: "Congratulations! Your first sale",
    body: (c) => `"${c.listing_title}" just sold for $${c.amount}. Your creator journey has begun.`,
    priority: "HIGH",
    action_url: "/creator/dashboard",
    action_label: "View Dashboard",
    icon_name: "Crown",
    cooldown_hours: 0,
  },
}

// ── Recent notification dedup check ────────────────────────────────────────
async function wasRecentlySent(userId: string, type: string, cooldownHours: number): Promise<boolean> {
  if (cooldownHours === 0) return false
  const since = new Date(Date.now() - cooldownHours * 3600 * 1000).toISOString()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", since)
  return (count || 0) > 0
}

async function sendNotification(userId: string, key: string, ctx: Record<string, unknown> = {}) {
  const t = TEMPLATES[key]
  if (!t) return
  if (await wasRecentlySent(userId, t.type, t.cooldown_hours)) return
  await supabase.from("notifications").insert({
    user_id: userId,
    type: t.type,
    title: t.title,
    message: t.body(ctx),
    priority: t.priority,
    action_url: t.action_url || null,
    action_label: t.action_label || null,
    icon_name: t.icon_name || null,
    metadata: { template_key: key, ...ctx },
  })
}

// ── Main evaluation loop ────────────────────────────────────────────────────
async function evaluateUser(userId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Fetch user data
  const [
    { data: userData },
    { data: sub },
    { count: apiCount },
    { data: assets },
    { data: listings },
    { count: salesCount },
  ] = await Promise.all([
    supabase.from("users").select("name, created_at").eq("id", userId).single(),
    supabase.from("subscriptions").select("tier, status").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("api_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart),
    supabase.from("assets").select("file_size").eq("user_id", userId),
    supabase.from("listings").select("id, title, created_at, updated_at").eq("creator_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("creator_id", userId).eq("status", "completed"),
  ])

  const tier = (sub?.tier || "FREE") as string
  const tierLimits: Record<string, { apiRateLimit: number; storageGb: number; priceMonthly: number; priceYearly: number }> = {
    FREE:     { apiRateLimit: 100,   storageGb: 1,   priceMonthly: 0,   priceYearly: 0 },
    STARTER:  { apiRateLimit: 500,   storageGb: 10,  priceMonthly: 19,  priceYearly: 190 },
    PRO:      { apiRateLimit: 2000,  storageGb: 100, priceMonthly: 49,  priceYearly: 490 },
    BUSINESS: { apiRateLimit: 10000, storageGb: 500, priceMonthly: 149, priceYearly: 1490 },
  }
  const limits = tierLimits[tier] || tierLimits.FREE
  const monthlyApiLimit = limits.apiRateLimit * 24 * 30
  const apiUsed = apiCount || 0
  const apiPct = monthlyApiLimit > 0 ? Math.round((apiUsed / monthlyApiLimit) * 100) : 0

  const storageBytes = assets?.reduce((s, a) => s + (a.file_size || 0), 0) || 0
  const storageGb = storageBytes / (1024 * 1024 * 1024)
  const storagePct = limits.storageGb > 0 ? Math.round((storageGb / limits.storageGb) * 100) : 0

  // ── Evaluate triggers ───────────────────────────────────────────────────
  const name = userData?.name || ""

  // 1. API usage warnings
  if (apiPct >= 95) {
    await sendNotification(userId, "usage_95pct", { pct: apiPct, used: apiUsed, limit: monthlyApiLimit })
  } else if (apiPct >= 80) {
    await sendNotification(userId, "usage_80pct", { used: apiUsed, limit: monthlyApiLimit })
  }

  // 2. Storage warning
  if (storagePct >= 80) {
    await sendNotification(userId, "storage_80pct", { used: storageGb.toFixed(2), limit: limits.storageGb })
  }

  // 3. Upgrade social proof (free/starter users with some activity)
  if (tier === "FREE" || tier === "STARTER") {
    if (apiUsed > 0 || (listings?.length || 0) > 0) {
      await sendNotification(userId, "upgrade_social_proof", { tier })
    }
  }

  // 4. Annual discount (paid monthly users)
  if (tier !== "FREE" && sub?.status === "ACTIVE") {
    const savings = limits.priceMonthly * 12 - limits.priceYearly
    if (savings > 0) {
      await sendNotification(userId, "annual_discount", { tier, savings })
    }
  }

  // 5. Retention: inactive 7 days
  if ((listings?.length || 0) > 0) {
    const lastListing = listings![0]
    const daysSinceActivity = (Date.now() - new Date(lastListing.updated_at || lastListing.created_at).getTime()) / 86400000
    if (daysSinceActivity >= 7) {
      await sendNotification(userId, "retention_inactive_7d", { name })
    }
  }

  // 6. First sale milestone
  if ((salesCount || 0) === 1) {
    const { data: firstSale } = await supabase
      .from("transactions")
      .select("amount, listing_id")
      .eq("creator_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: true })
      .limit(1)
      .single()
    if (firstSale) {
      const { data: listing } = await supabase.from("listings").select("title").eq("id", firstSale.listing_id).single()
      await sendNotification(userId, "first_sale", {
        listing_title: listing?.title || "Your listing",
        amount: ((firstSale.amount || 0) / 100).toFixed(2),
      })
    }
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  try {
    // Can be called as a scheduled cron OR with a specific userId
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {}
    const targetUserId: string | null = body.user_id || null

    if (targetUserId) {
      // Single-user evaluation (triggered by events)
      await evaluateUser(targetUserId)
      return new Response(JSON.stringify({ ok: true, evaluated: 1 }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Batch evaluation: all active users (paginate to avoid timeout)
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .limit(200)

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ ok: true, evaluated: 0 }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    let evaluated = 0
    for (const u of users) {
      try {
        await evaluateUser(u.id)
        evaluated++
      } catch {
        // continue on per-user errors
      }
    }

    return new Response(JSON.stringify({ ok: true, evaluated }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
