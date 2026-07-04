/**
 * POST /api/nexus/bridge/sync
 * Receives workspace sync data from IDE via bridge server.
 * Stores file context for agent use.
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { files } = body

    const supabase = await createClient()

    // Verify device token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deviceToken = authHeader.replace("Bearer ", "")

    // Verify device token
    const { data: device, error: deviceError } = await supabase
      .from("bridge_devices")
      .select("*")
      .eq("token", deviceToken)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Invalid device token" }, { status: 401 })
    }

    // Store file context in bridge_context table
    // TODO: Create bridge_context table and store files
    // For now, just acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: "Workspace sync received",
      files_count: files?.length || 0 
    })
  } catch (e) {
    console.error("bridge/sync POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
