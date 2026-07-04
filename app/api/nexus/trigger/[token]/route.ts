import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Public webhook trigger endpoint — no user auth required.
 * POST /api/nexus/trigger/:token
 * Validates the token, optionally verifies HMAC signature, then enqueues the workflow execution.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Look up the webhook token (no RLS needed for trigger — bypassed by service role or anon select)
  const { data: webhook, error: lookupErr } = await supabase
    .from("nexus_webhook_tokens")
    .select("id, workflow_id, user_id, secret, enabled")
    .eq("token", token)
    .single()

  if (lookupErr || !webhook) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 404 })
  }
  if (!webhook.enabled) {
    return NextResponse.json({ error: "Webhook is disabled" }, { status: 403 })
  }

  // Optional HMAC-SHA256 signature check (X-Nexus-Signature: sha256=<hex>)
  const sig = request.headers.get("x-nexus-signature")
  if (sig) {
    const body = await request.text()
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(webhook.secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    )
    const expected = sig.replace(/^sha256=/, "")
    const bodyBytes = encoder.encode(body)
    const sigBytes = new Uint8Array(expected.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, bodyBytes)
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })

    // Parse body now that we've verified
    let payload: Record<string, unknown> = {}
    try { payload = JSON.parse(body) } catch { /* non-JSON body is fine */ }

    return triggerWorkflow(supabase, webhook, payload)
  }

  // No signature — accept payload directly
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>
  return triggerWorkflow(supabase, webhook, payload)
}

async function triggerWorkflow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  webhook: { id: string; workflow_id: string; user_id: string },
  payload: Record<string, unknown>
) {
  // Create execution record
  const { data: execution, error } = await supabase
    .from("nexus_workflow_executions")
    .insert({
      workflow_id: webhook.workflow_id,
      user_id: webhook.user_id,
      status: "pending",
      input_data: payload,
      trigger: "webhook",
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_used_at on the webhook token
  await supabase
    .from("nexus_webhook_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", webhook.id)

  // Fire-and-forget: call the execute API internally
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  fetch(`${siteUrl}/api/nexus/workflows/${webhook.workflow_id}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-nexus-internal": "webhook" },
    body: JSON.stringify({ execution_id: execution.id, input: payload }),
  }).catch(() => { /* best-effort */ })

  return NextResponse.json({ execution_id: execution.id, status: "queued" }, { status: 202 })
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: webhook } = await supabase
    .from("nexus_webhook_tokens")
    .select("workflow_id, enabled, nexus_workflows(name)")
    .eq("token", token)
    .single()

  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    workflow: ((webhook.nexus_workflows as unknown as { name: string } | null))?.name ?? webhook.workflow_id,
    enabled: webhook.enabled,
    methods: ["POST"],
  })
}
