import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

    const service = createServiceClient()

    const { data: existing } = await service
      .from("workflow_expansions")
      .select("id, status, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (existing.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only COMPLETED workflows can be archived" },
        { status: 400 }
      )
    }

    const { error } = await service
      .from("workflow_expansions")
      .update({
        status: "ARCHIVED",
        archived_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
