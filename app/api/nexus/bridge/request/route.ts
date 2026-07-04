/**
 * POST /api/nexus/bridge/request
 * Called by the midas-bridge CLI to create an auth request.
 * No user auth required — the token identifies the request.
 * Returns: { token, authUrl } so the CLI can open the browser.
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getSiteUrl } from "@/lib/site-url"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ide_name, ide_version, device_name, device_os, device_arch, bridge_port, bridge_version } = body

    if (!ide_name || !device_name || !bridge_port) {
      return NextResponse.json(
        { error: "ide_name, device_name, bridge_port required" },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS for the insert
    const supabase = await createClient()

    const token = randomBytes(24).toString("hex")

    const { data, error } = await supabase
      .from("bridge_auth_requests")
      .insert({
        token,
        ide_name,
        ide_version: ide_version ?? null,
        device_name,
        device_os: device_os ?? null,
        device_arch: device_arch ?? null,
        bridge_port,
        bridge_version: bridge_version ?? null,
        status: "pending",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("bridge/request POST", error)
      return NextResponse.json({ error: "Failed to create auth request" }, { status: 500 })
    }

    const siteUrl = getSiteUrl()
    const authUrl = `${siteUrl}/nexus/bridge/authorize/${token}`

    return NextResponse.json({ token, authUrl, id: data.id })
  } catch (e) {
    console.error("bridge/request POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
