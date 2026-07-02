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

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const service = createServiceClient();
    const { data: wf } = await service
      .from("workflow_expansions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (wf.status === "ANALYZED") {
      return NextResponse.json({
        status: "ANALYZED",
        file_count: wf.file_count || 0,
        analysis_summary: wf.expansion_config?.analysis_summary || null,
      });
    }

    if (!["IMPORTED", "DRAFT"].includes(wf.status)) {
      return NextResponse.json(
        { error: "Only IMPORTED or DRAFT workflows can be analyzed" },
        { status: 400 }
      );
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
      .eq("id", id);

    // Fire-and-forget analysis (we'll implement the background function later if needed)
    // For now, we just return and let the frontend poll for status
    // In a real implementation, we would trigger a background job
    // But to keep it simple, we'll just return and the frontend can poll the GET endpoint

    return NextResponse.json({
      status: "ANALYZING",
      eta_seconds: 30,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
