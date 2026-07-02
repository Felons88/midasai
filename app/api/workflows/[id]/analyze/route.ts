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
    const { data: wf } = await service
      .from("workflow_expansions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (wf.status === "ANALYZED") {
      return NextResponse.json({
        status: "ANALYZED",
        stage: "analysis_complete",
        progress: 100,
        file_count: wf.file_count || 0,
        analysis_summary: wf.expansion_config?.analysis_summary || null,
      })
    }

    if (!["IMPORTED", "DRAFT"].includes(wf.status)) {
      return NextResponse.json(
        { error: "Only IMPORTED or DRAFT workflows can be analyzed" },
        { status: 400 }
      )
    }

    // Start background analysis
    await service
      .from("workflow_expansions")
      .update({
        status: "ANALYZING",
        pipeline_stage: "deep_scan",
        pipeline_progress: 5,
        started_at: new Date().toISOString(),
        expansion_config: {
          ...(typeof wf.expansion_config === "object" ? wf.expansion_config : {}),
          analysis_started_at: new Date().toISOString(),
        },
      })
      .eq("id", id)

    // Fire-and-forget analysis (we'll implement the background function later if needed)
    // For now, we just return and let the frontend poll for status
    // In a real implementation, we would trigger a background job
    // But to keep it simple, we'll just return and the frontend can poll the GET endpoint

    return NextResponse.json({
      status: "ANALYZING",
      stage: "deep_scan",
      progress: 5,
      eta_seconds: 30,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

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
      .select("status, pipeline_stage, pipeline_progress, file_count, expansion_config")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Return analysis status for polling
    const expansionConfig = typeof data.expansion_config === "object" ? data.expansion_config : {}

    return NextResponse.json({
      status: data.status,
      stage: data.pipeline_stage,
      progress: data.pipeline_progress,
      file_count: data.file_count || 0,
      analysis_summary: expansionConfig.analysis_summary || null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
