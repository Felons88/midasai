/**
 * GET  /api/nexus/bridge/authorize/[token]  — fetch request details (for the auth page)
 * POST /api/nexus/bridge/authorize/[token]  — approve or deny (requires logged-in user)
 * GET  /api/nexus/bridge/authorize/[token]/poll — CLI polling endpoint
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bridge_auth_requests")
    .select("id, token, ide_name, ide_version, device_name, device_os, device_arch, bridge_port, bridge_version, status, expires_at, created_at")
    .eq("token", token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("bridge_auth_requests").update({ status: "expired" }).eq("token", token)
    return NextResponse.json({ error: "Request expired" }, { status: 410 })
  }

  return NextResponse.json({ request: data })
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params
  const supabase = await createClient()

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action } = await request.json() // action: "approve" | "deny"
  if (!["approve", "deny"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or deny" }, { status: 400 })
  }

  // Fetch the request
  const { data: authReq, error: fetchErr } = await supabase
    .from("bridge_auth_requests")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single()

  if (fetchErr || !authReq) {
    return NextResponse.json({ error: "Request not found or already handled" }, { status: 404 })
  }

  if (new Date(authReq.expires_at) < new Date()) {
    await supabase.from("bridge_auth_requests").update({ status: "expired" }).eq("token", token)
    return NextResponse.json({ error: "Request expired" }, { status: 410 })
  }

  if (action === "deny") {
    await supabase
      .from("bridge_auth_requests")
      .update({ status: "denied", denied_at: new Date().toISOString(), user_id: user.id })
      .eq("token", token)
    return NextResponse.json({ success: true, status: "denied" })
  }

  // Approve — generate long-lived device token and save device
  const deviceToken = randomBytes(32).toString("hex")

  const { error: deviceErr } = await supabase
    .from("bridge_devices")
    .upsert({
      user_id: user.id,
      ide_name: authReq.ide_name,
      ide_version: authReq.ide_version,
      device_name: authReq.device_name,
      device_os: authReq.device_os,
      device_arch: authReq.device_arch,
      bridge_port: authReq.bridge_port,
      device_token: deviceToken,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "user_id,device_name,ide_name" })

  if (deviceErr) {
    console.error("bridge/authorize upsert device", deviceErr)
    return NextResponse.json({ error: "Failed to save device" }, { status: 500 })
  }

  // Mark request as approved with user_id and device_token (CLI will poll and receive this)
  await supabase
    .from("bridge_auth_requests")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      user_id: user.id,
    })
    .eq("token", token)

  // Also upsert into nexus_connections so bridge shows as connected
  await supabase
    .from("nexus_connections")
    .upsert({
      user_id: user.id,
      name: authReq.ide_name,
      type: "IDE",
      status: "connected",
      connection_config: {
        device_name: authReq.device_name,
        device_os: authReq.device_os,
        bridge_port: authReq.bridge_port,
        device_token: deviceToken,
      },
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,name" })

  return NextResponse.json({ success: true, status: "approved", device_token: deviceToken })
}
