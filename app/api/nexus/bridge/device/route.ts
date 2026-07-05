/**
 * POST /api/nexus/bridge/device
 * Authenticated endpoint for creating a bridge device directly (no browser approval).
 * Requires Bearer token from CLI login.
 * Auto-creates MCP connection.
 * Returns: { device_token, mcp_endpoint }
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getSiteUrl } from "@/lib/site-url"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authToken = authHeader.replace("Bearer ", "")
    const body = await request.json()
    const { ide_name, ide_version, device_name, device_os, device_arch, bridge_port, bridge_version } = body

    if (!ide_name || !device_name || !bridge_port) {
      return NextResponse.json(
        { error: "ide_name, device_name, bridge_port required" },
        { status: 400 }
      )
    }

    // Validate auth token against cli_login_requests to get user_id
    const supabase = await createClient()
    const { data: loginRequest, error: authError } = await supabase
      .from("cli_login_requests")
      .select("user_id")
      .eq("auth_token", authToken)
      .eq("status", "approved")
      .single()

    if (authError || !loginRequest) {
      return NextResponse.json({ error: "Invalid or expired auth token" }, { status: 401 })
    }

    const deviceToken = randomBytes(32).toString("hex")

    const { data: device, error: deviceError } = await supabase
      .from("bridge_devices")
      .insert({
        user_id: loginRequest.user_id,
        device_token: deviceToken,
        ide_name,
        ide_version: ide_version ?? null,
        device_name,
        device_os: device_os ?? null,
        device_arch: device_arch ?? null,
        bridge_port,
        bridge_version: bridge_version ?? null,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single()

    if (deviceError) {
      console.error("bridge/device POST", deviceError)
      return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
    }

    // Auto-create MCP connection
    const { createMcpConnection } = await import("@/lib/mcp/create-connection")
    const mcpResult = await createMcpConnection(
      `${ide_name} Bridge (${device_name})`,
      supabase
    )

    if (!mcpResult.ok) {
      console.error("bridge/device MCP creation failed", mcpResult.error)
      // Continue anyway — device is created, MCP is optional
    }

    const siteUrl = getSiteUrl()
    const mcpEndpoint = `${siteUrl}/api/mcp`

    return NextResponse.json({
      device_token: deviceToken,
      mcp_endpoint: mcpResult.ok ? mcpEndpoint : null,
    })
  } catch (e) {
    console.error("bridge/device POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
