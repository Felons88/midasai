/**
 * GET /api/nexus/bridge/authorize/[token]/poll
 * Called by the midas-bridge CLI every 2s to check if the user has approved.
 * Returns status + device_token once approved.
 * No auth required — token is the secret.
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bridge_auth_requests")
    .select("status, expires_at, approved_at, denied_at, user_id")
    .eq("token", token)
    .single()

  if (error || !data) {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  if (new Date(data.expires_at) < new Date() && data.status === "pending") {
    await supabase.from("bridge_auth_requests").update({ status: "expired" }).eq("token", token)
    return NextResponse.json({ status: "expired" })
  }

  if (data.status === "approved" && data.user_id) {
    // Fetch device_token from bridge_devices
    const { data: device } = await supabase
      .from("bridge_devices")
      .select("device_token, ide_name")
      .eq("user_id", data.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Fetch the latest MCP token for the bridge MCP server (auto-created on approval)
    const { data: mcpServer } = await supabase
      .from("mcp_servers")
      .select("id, name, endpoint")
      .eq("user_id", data.user_id)
      .ilike("name", `% Bridge (%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      status: "approved",
      device_token: device?.device_token ?? null,
      mcp_server_id: mcpServer?.id ?? null,
      mcp_endpoint: mcpServer?.endpoint ?? null,
    })
  }

  return NextResponse.json({ status: data.status })
}
