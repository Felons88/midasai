import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET(
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
    const { data, error } = await service
      .from("workflow_expansions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Also fetch steps
    const { data: steps } = await service
      .from("workflow_expansion_steps")
      .select("*")
      .eq("expansion_id", id)
      .order("step_order", { ascending: true })

    return NextResponse.json({ workflow: data, steps: steps ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check ownership and deletable status
    const { data: existing } = await service
      .from("workflow_expansions")
      .select("id, status, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (!["DRAFT", "FAILED", "IMPORTED"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Only DRAFT, IMPORTED, or FAILED workflows can be deleted. Archive completed workflows first." },
        { status: 400 }
      )
    }

    const { error } = await service
      .from("workflow_expansions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
