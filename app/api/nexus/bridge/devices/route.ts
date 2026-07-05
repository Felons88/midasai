/**
 * GET  /api/nexus/bridge/devices  — list approved devices for logged-in user
 * DELETE /api/nexus/bridge/devices?id=xxx  — revoke a device
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("bridge_devices")
    .select("id, ide_name, ide_version, device_name, device_os, device_arch, bridge_port, last_seen, created_at")
    .eq("user_id", user.id)
    .order("last_seen", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  return NextResponse.json({ devices: data ?? [] })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await supabase.from("bridge_devices").delete().eq("id", id).eq("user_id", user.id)

  // Also mark the nexus_connection as disconnected (best effort)
  const { data: device } = await supabase
    .from("bridge_devices")
    .select("ide_name")
    .eq("id", id)
    .single()
  if (device) {
    await supabase
      .from("nexus_connections")
      .update({ status: "disconnected" })
      .eq("user_id", user.id)
      .eq("name", device.ide_name)
  }

  return NextResponse.json({ success: true })
}
