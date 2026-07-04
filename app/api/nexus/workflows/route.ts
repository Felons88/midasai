import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const svc = createNexusService(supabase, user.id)
    const workflows = await svc.listWorkflows()
    return NextResponse.json({ workflows })
  } catch (e) {
    console.error("nexus/workflows GET", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json()
    const { name, description, definition } = body
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
    const svc = createNexusService(supabase, user.id)
    const workflow = await svc.createWorkflow({ name, description, definition })
    return NextResponse.json({ workflow }, { status: 201 })
  } catch (e) {
    console.error("nexus/workflows POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
