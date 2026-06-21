import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enforceLimit, LimitExceededError } from "@/lib/subscription-guard"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ── Server-side limit enforcement ─────────────────────────────────────────
  let limitResult
  try {
    limitResult = await enforceLimit(user.id, "api_keys")
  } catch (e) {
    if (e instanceof LimitExceededError) {
      return NextResponse.json(
        {
          error: "limit_exceeded",
          message: e.message,
          currentCount: e.result.currentCount,
          limit: e.result.limit,
          tier: e.result.tier,
          upgradeRequired: e.result.upgradeRequired ?? null,
        },
        { status: 403 }
      )
    }
    throw e
  }

  const body = await request.json()
  const {
    name, description, permissions, rateLimit,
    expiresAt, restrictionType, allowedIps, allowedDomains,
  } = body as {
    name?: string
    description?: string
    permissions?: string[]
    rateLimit?: number
    expiresAt?: string | null
    restrictionType?: string
    allowedIps?: string[] | null
    allowedDomains?: string[] | null
  }

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  // ── Generate key server-side ───────────────────────────────────────────────
  const rawKey = `midas_live_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`
  const keyPrefix = rawKey.substring(0, 16)

  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey))
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")

  const { data: newKey, error: insertErr } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      key_value: rawKey,
      permissions: permissions ?? ["read"],
      rate_limit: rateLimit ?? 100,
      expires_at: expiresAt ?? null,
      status: "ACTIVE",
      restriction_type: restrictionType ?? "none",
      allowed_ips: restrictionType === "ip" && (allowedIps?.length ?? 0) > 0 ? allowedIps : null,
      allowed_domains: restrictionType === "domain" && (allowedDomains?.length ?? 0) > 0 ? allowedDomains : null,
    })
    .select("id")
    .single()

  if (insertErr) {
    console.error("[api/keys] insert error:", insertErr)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }

  await supabase.from("api_logs").insert({
    user_id: user.id,
    api_key_id: newKey?.id ?? null,
    level: "INFO",
    message: `API key created: ${name.trim()}`,
    metadata: { name: name.trim(), permissions, rate_limit: rateLimit },
  })

  return NextResponse.json({
    success: true,
    key: {
      id: newKey?.id,
      raw: rawKey,   // Returned ONCE
      prefix: keyPrefix,
      name: name.trim(),
    },
    plan: {
      currentCount: limitResult.currentCount + 1,
      limit: limitResult.limit,
      tier: limitResult.tier,
    },
  })
}
