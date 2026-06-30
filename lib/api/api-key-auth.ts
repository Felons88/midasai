import { createHash } from "crypto"
import { createServiceClient } from "@/lib/supabase/server"
import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from "@/lib/api/rate-limit"
import { getCachedAuth, setCachedAuth, shouldUpdateLastUsed } from "@/lib/api/auth-cache"

export type ApiKeyContext = {
  userId: string
  keyId: string
  rateLimit: number
  permissions: string[]
}

export function extractRawApiKey(request: Request): string | null {
  const authorization = request.headers.get("authorization")
  if (authorization) {
    const trimmed = authorization.trim()
    if (/^Bearer\s+/i.test(trimmed)) {
      return trimmed.replace(/^Bearer\s+/i, "").trim()
    }
    return trimmed
  }
  return request.headers.get("x-api-key")?.trim() ?? null
}

export function isApiKeyFormat(key: string): boolean {
  return key.startsWith("mk_") || key.startsWith("midas_live_")
}

function touchLastUsed(keyId: string) {
  if (!shouldUpdateLastUsed(keyId)) return

  const service = createServiceClient()
  void service
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyId)
    .then(({ error }) => {
      if (error) console.error("[api-key-auth] last_used update failed:", error)
    })
}

export async function authenticateApiKey(
  request: Request
): Promise<
  | { ok: true; ctx: ApiKeyContext; rateLimit: RateLimitResult }
  | { ok: false; response: Response }
> {
  const rawKey = extractRawApiKey(request)

  if (!rawKey || !isApiKeyFormat(rawKey)) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: "Missing or invalid API key",
          hint: "Use Authorization: Bearer YOUR_KEY or X-API-Key header",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    }
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex")
  const cached = getCachedAuth(keyHash)

  if (cached) {
    const limit = cached.rateLimit
    const rateLimit = checkRateLimit(`apikey:${cached.ctx.keyId}`, limit)
    if (!rateLimit.allowed) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitHeaders(rateLimit),
          },
        }),
      }
    }

    touchLastUsed(cached.ctx.keyId)
    return { ok: true, ctx: cached.ctx, rateLimit }
  }

  const service = createServiceClient()

  const { data: keyRow, error } = await service
    .from("api_keys")
    .select("id, user_id, rate_limit, status, expires_at, permissions")
    .eq("key_hash", keyHash)
    .maybeSingle()

  if (error || !keyRow || keyRow.status !== "ACTIVE") {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    }
  }

  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "API key expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    }
  }

  const limit = keyRow.rate_limit ?? 100
  const rateLimit = checkRateLimit(`apikey:${keyRow.id}`, limit)

  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders(rateLimit),
        },
      }),
    }
  }

  const ctx: ApiKeyContext = {
    userId: keyRow.user_id,
    keyId: keyRow.id,
    rateLimit: limit,
    permissions: keyRow.permissions ?? ["read"],
  }

  setCachedAuth(keyHash, ctx, limit)
  touchLastUsed(keyRow.id)

  return { ok: true, ctx, rateLimit }
}

export async function logApiUsage(
  ctx: ApiKeyContext,
  request: Request,
  endpoint: string,
  statusCode: number,
  latencyMs: number
) {
  const service = createServiceClient()
  const forwarded = request.headers.get("x-forwarded-for")
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? null

  await service.from("api_usage").insert({
    user_id: ctx.userId,
    api_key_id: ctx.keyId,
    endpoint,
    method: request.method,
    status_code: statusCode,
    latency_ms: latencyMs,
    user_agent: request.headers.get("user-agent"),
    ip_address: ipAddress,
  })
}
