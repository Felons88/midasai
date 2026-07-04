import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const svc = createNexusService(supabase, user.id)
    const workflow = await svc.getWorkflow(id)
    return NextResponse.json({ workflow })
  } catch (e) {
    console.error("nexus/workflows/[id] GET", e)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const svc = createNexusService(supabase, user.id)
    const workflow = await svc.updateWorkflow(id, body)
    return NextResponse.json({ workflow })
  } catch (e) {
    console.error("nexus/workflows/[id] PATCH", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const svc = createNexusService(supabase, user.id)
    await svc.deleteWorkflow(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("nexus/workflows/[id] DELETE", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
