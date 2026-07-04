/**
 * POST /api/nexus/bridge/push
 * Pushes events from MidasAI to connected IDEs via bridge server.
 * Used for file operations, workflow results, notifications.
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { device_id, event } = body

    if (!device_id || !event) {
      return NextResponse.json({ error: "device_id and event required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get device info to find bridge port
    const { data: device, error: deviceError } = await supabase
      .from("bridge_devices")
      .select("*")
      .eq("id", device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Push event to bridge server via HTTP
    const bridgeUrl = `http://localhost:${device.bridge_port}/midas-bridge/push`
    
    try {
      const response = await fetch(bridgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      })

      if (!response.ok) {
        console.error("Bridge push failed", await response.text())
        return NextResponse.json({ error: "Bridge not reachable" }, { status: 502 })
      }

      return NextResponse.json({ success: true })
    } catch (err) {
      console.error("Bridge push error", err)
      return NextResponse.json({ error: "Bridge not reachable" }, { status: 502 })
    }
  } catch (e) {
    console.error("bridge/push POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
