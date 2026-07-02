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
    if (!user) {
      // Allow unauthenticated access for debugging – fetch without user filter
      const service = createServiceClient()
      const { data: expansion, error } = await service
        .from("workflow_expansions")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw error
      if (!expansion) return NextResponse.json({ error: "Not found" }, { status: 404 })
      // Fetch steps as before
      const { data: steps } = await service
        .from("workflow_expansion_steps")
        .select("*")
        .eq("expansion_id", id)
        .order("step_order", { ascending: true })
      return NextResponse.json({ workflow: expansion, workflow_conversation_memory: null, steps: steps ?? [] })
    }

    const service = createServiceClient()

    // First get the workflow expansion with latest_memory_id
    const { data: expansion, error } = await service
      .from("workflow_expansions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error
    if (!expansion) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Then fetch conversation memory if latest_memory_id exists
    let conversationMemory = null
    if (expansion.latest_memory_id) {
      const { data: memory, error: memoryError } = await service
        .from("workflow_conversation_memory")
        .select("conversation_history, file_change_purposes, context_snapshot, last_round, total_interactions")
        .eq("id", expansion.latest_memory_id)
        .single()

      if (!memoryError && memory) {
        conversationMemory = memory
      }
    }

    // Also fetch steps
    const { data: steps } = await service
      .from("workflow_expansion_steps")
      .select("*")
      .eq("expansion_id", id)
      .order("step_order", { ascending: true })

    return NextResponse.json({
      workflow: expansion,
      workflow_conversation_memory: conversationMemory,
      steps: steps ?? []
    })
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
