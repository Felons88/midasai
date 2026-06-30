import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

    const service = createServiceClient()
    const { data, error } = await service
      .from("workflow_expansions")
      .select(
        "id, title, description, status, pipeline_stage, pipeline_progress, file_count, github_repo_url, error_message, created_at, updated_at, started_at, completed_at, archived_at, session_id, expansion_config"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ workflows: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message || JSON.stringify(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

    const body = await req.json()
    const { title, description, session_id, generated_files } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const hasFiles =
      generated_files &&
      typeof generated_files === "object" &&
      !Array.isArray(generated_files) &&
      Object.keys(generated_files).length > 0

    const service = createServiceClient()
    const { data, error } = await service
      .from("workflow_expansions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        session_id: session_id || null,
        status: hasFiles ? "IMPORTED" : "DRAFT",
        generated_files: hasFiles ? generated_files : {},
        file_count: hasFiles ? Object.keys(generated_files).length : 0,
        ...(hasFiles ? { completed_at: new Date().toISOString() } : {}),
      })
      .select("id, title, status, created_at, file_count")
      .single()

    if (error) throw error
    return NextResponse.json({ workflow: data }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message || JSON.stringify(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
