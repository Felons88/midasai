import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const svc = createNexusService(supabase, user.id)
    const connections = await svc.listConnections()
    return NextResponse.json({ connections })
  } catch (e) {
    console.error("nexus/connections GET", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json()
    const { name, type, status, connection_config } = body
    if (!name || !type || !status) return NextResponse.json({ error: "name, type and status required" }, { status: 400 })
    const svc = createNexusService(supabase, user.id)
    const connection = await svc.upsertConnection({ name, type, status, connection_config })
    return NextResponse.json({ connection })
  } catch (e) {
    console.error("nexus/connections POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
