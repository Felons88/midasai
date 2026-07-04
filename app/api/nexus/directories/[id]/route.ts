import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const svc = createNexusService(supabase, user.id)
    await svc.deleteDirectory(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("nexus/directories/[id] DELETE", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
