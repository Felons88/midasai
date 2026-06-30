import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

    const service = createServiceClient()

    // Fetch single session for restore
    if (id) {
      const { data, error } = await service
        .from("architect_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return NextResponse.json({ session: data })
    }

    // List all sessions for this user, newest first
    const { data, error } = await service
      .from("architect_sessions")
      .select("id, session_name, phase, confidence, file_count, created_at, updated_at, completed_at, summary")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ sessions: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, sessionId, ...payload } = body

    const service = createServiceClient()
    let userId: string | null = null

    // Try to get authenticated user — non-blocking
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch { /* anonymous session */ }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    const ua = req.headers.get("user-agent") ?? null

    if (action === "create") {
      const { data, error } = await service
        .from("architect_sessions")
        .insert({
          user_id: userId,
          phase: "discovery",
          confidence: 0,
          messages: payload.messages ?? [],
          ip_address: ip,
          user_agent: ua,
        })
        .select("id")
        .single()

      if (error) throw error
      return NextResponse.json({ sessionId: data.id })
    }

    if (action === "update" && sessionId) {
      const update: Record<string, unknown> = {}
      if (payload.messages !== undefined) update.messages = payload.messages
      if (payload.phase !== undefined) update.phase = payload.phase
      if (payload.confidence !== undefined) update.confidence = payload.confidence
      if (payload.summary !== undefined) update.summary = payload.summary
      if (payload.session_name !== undefined) update.session_name = payload.session_name

      const { error } = await service
        .from("architect_sessions")
        .update(update)
        .eq("id", sessionId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "complete" && sessionId) {
      const fileCount = payload.generated_files
        ? Object.keys(payload.generated_files).length
        : 0

      const { error } = await service
        .from("architect_sessions")
        .update({
          phase: "done",
          generated_files: payload.generated_files ?? null,
          file_count: fileCount,
          summary: payload.summary ?? null,
          messages: payload.messages ?? [],
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[architect/session]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
