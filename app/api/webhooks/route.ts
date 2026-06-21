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
    limitResult = await enforceLimit(user.id, "webhooks")
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
  const { name, url, events } = body as { name?: string; url?: string; events?: string[] }

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 })
  if (!events || events.length === 0) return NextResponse.json({ error: "Select at least one event" }, { status: 400 })

  // Validate URL
  try { new URL(url) } catch {
    return NextResponse.json({ error: "Invalid endpoint URL" }, { status: 400 })
  }

  // ── Auto-generate cryptographically secure signing secret ─────────────────
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const secret = "whsec_" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("")

  // ── Create webhook via RPC (enum-safe, limit-checked at DB level too) ──────
  let webhookId: string | null = null

  const { data: rpcData, error: rpcErr } = await supabase.rpc("create_webhook", {
    p_user_id: user.id,
    p_name: name.trim(),
    p_url: url.trim(),
    p_events: events,
    p_secret: secret,
  })

  if (rpcErr) {
    // DB-level limit exceeded (defense in depth)
    if (rpcErr.message?.includes("LIMIT_EXCEEDED")) {
      return NextResponse.json({ error: "limit_exceeded", message: rpcErr.message }, { status: 403 })
    }
    // Fallback: direct insert (e.g., enum casting not supported on older schema)
    const { data: inserted, error: insertErr } = await supabase
      .from("webhooks")
      .insert({
        user_id: user.id,
        name: name.trim(),
        url: url.trim(),
        events,
        secret,
        status: "ACTIVE",
        total_deliveries: 0,
        failed_deliveries: 0,
      })
      .select("id")
      .single()

    if (insertErr) {
      console.error("[api/webhooks] insert error:", insertErr)
      return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
    }
    webhookId = inserted?.id ?? null
  } else {
    webhookId = rpcData as string ?? null
  }

  return NextResponse.json({
    success: true,
    webhook: {
      id: webhookId,
      name: name.trim(),
      url: url.trim(),
      events,
      secret,       // Returned ONCE — client must display and never request again
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
    plan: {
      currentCount: limitResult.currentCount + 1,
      limit: limitResult.limit,
      tier: limitResult.tier,
    },
  })
}
