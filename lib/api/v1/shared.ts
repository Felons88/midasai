import { NextResponse } from "next/server"
import type { ApiKeyContext } from "@/lib/api/api-key-auth"
import { logApiUsage } from "@/lib/api/api-key-auth"
import { rateLimitHeaders, type RateLimitResult } from "@/lib/api/rate-limit"

export function jsonError(
  message: string,
  status: number,
  rateLimit?: RateLimitResult,
  extra?: Record<string, string>
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(rateLimit ? rateLimitHeaders(rateLimit) : {}),
        ...extra,
      },
    }
  )
}

export function jsonOk<T>(
  body: T,
  rateLimit: RateLimitResult,
  extraHeaders?: Record<string, string>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...rateLimitHeaders(rateLimit),
      ...extraHeaders,
    },
  })
}

const PERMISSION_ALIASES: Record<string, string[]> = {
  read: ["read", "read:listings", "read:profile", "read:analytics", "read:webhooks"],
  write: ["write", "write:listings", "write:profile", "write:webhooks"],
  delete: ["delete", "delete:listings", "delete:webhooks"],
}

export function hasPermission(ctx: ApiKeyContext, permission: string): boolean {
  const perms = ctx.permissions
  if (perms.includes("admin") || perms.includes("*")) return true
  if (perms.includes(permission)) return true
  const aliases = PERMISSION_ALIASES[permission] ?? [permission]
  return aliases.some((alias) => perms.includes(alias))
}

export function requirePermission(
  ctx: ApiKeyContext,
  permission: string,
  rateLimit: RateLimitResult
) {
  if (!hasPermission(ctx, permission)) {
    return jsonError(`API key missing '${permission}' permission`, 403, rateLimit)
  }
  return null
}

export function scheduleUsageLog(
  ctx: ApiKeyContext,
  request: Request,
  endpoint: string,
  statusCode: number,
  latencyMs: number
) {
  void logApiUsage(ctx, request, endpoint, statusCode, latencyMs).catch((error) => {
    console.error("[v1] usage log failed:", error)
  })
}
