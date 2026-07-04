import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNexusService } from "@/lib/nexus/service"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json().catch(() => ({}))
    const directoryPath = body.path ?? "."
    const svc = createNexusService(supabase, user.id)
    const result = await svc.optimize(directoryPath)
    return NextResponse.json({ result })
  } catch (e) {
    console.error("nexus/optimize POST", e)
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 })
  }
}
