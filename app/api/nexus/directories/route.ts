import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const svc = createNexusService(supabase, user.id)
    const directories = await svc.listDirectories()
    return NextResponse.json({ directories })
  } catch (e) {
    console.error("nexus/directories GET", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json()
    const { name, path, type, metadata } = body
    if (!name || !path || !type) return NextResponse.json({ error: "name, path and type required" }, { status: 400 })
    const svc = createNexusService(supabase, user.id)
    const directory = await svc.createDirectory({ name, path, type, metadata })
    return NextResponse.json({ directory }, { status: 201 })
  } catch (e) {
    console.error("nexus/directories POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}