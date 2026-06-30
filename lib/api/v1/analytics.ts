import { NextRequest } from "next/server"
import { authenticateApiKey } from "@/lib/api/api-key-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { jsonError, jsonOk, requirePermission, scheduleUsageLog } from "@/lib/api/v1/shared"

export async function handleV1AnalyticsUsageGet(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "read", auth.rateLimit)
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "30", 10)))
  const since = new Date()
  since.setDate(since.getDate() - days)

  const supabase = createServiceClient()
  const { data, error, count } = await supabase
    .from("api_usage")
    .select("endpoint, method, status_code, latency_ms, created_at", { count: "planned" })
    .eq("api_key_id", auth.ctx.keyId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    scheduleUsageLog(auth.ctx, request, "/v1/analytics/usage", 500, Date.now() - started)
    return jsonError("Failed to load usage analytics", 500, auth.rateLimit)
  }

  const rows = data ?? []
  const summary = {
    total_requests: count ?? rows.length,
    period_days: days,
    avg_latency_ms:
      rows.length > 0
        ? Math.round(rows.reduce((sum, row) => sum + (row.latency_ms ?? 0), 0) / rows.length)
        : 0,
    error_count: rows.filter((row) => (row.status_code ?? 200) >= 400).length,
  }

  scheduleUsageLog(auth.ctx, request, "/v1/analytics/usage", 200, Date.now() - started)
  return jsonOk({ summary, recent: rows }, auth.rateLimit)
}

export async function handleV1AnalyticsListingsGet(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "read", auth.rateLimit)
  if (denied) return denied

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, slug, status, views, downloads, average_rating, review_count, created_at, updated_at")
    .eq("creator_id", auth.ctx.userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    scheduleUsageLog(auth.ctx, request, "/v1/analytics/listings", 500, Date.now() - started)
    return jsonError("Failed to load listing analytics", 500, auth.rateLimit)
  }

  const listings = data ?? []
  const summary = {
    total_listings: listings.length,
    active_listings: listings.filter((l) => l.status === "ACTIVE").length,
    total_views: listings.reduce((sum, l) => sum + (l.views ?? 0), 0),
    total_downloads: listings.reduce((sum, l) => sum + (l.downloads ?? 0), 0),
  }

  scheduleUsageLog(auth.ctx, request, "/v1/analytics/listings", 200, Date.now() - started)
  return jsonOk({ summary, listings }, auth.rateLimit)
}
