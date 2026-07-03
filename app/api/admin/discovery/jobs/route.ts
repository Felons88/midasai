import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { runDiscoveryJob } from "@/lib/discovery/github"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  query_id: z.string().uuid(),
})

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from("discovery_jobs")
    .select("*, discovery_queries(name)")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: data ?? [] })
}

export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: query, error: queryError } = await service
    .from("discovery_queries")
    .select("*")
    .eq("id", parsed.data.query_id)
    .single()

  if (queryError || !query) {
    return NextResponse.json({ error: queryError?.message || "Query not found" }, { status: 404 })
  }

  const { data: job, error: jobError } = await service
    .from("discovery_jobs")
    .insert({
      query_id: query.id,
      status: "pending",
      created_by: auth.user.id,
    })
    .select("*")
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message || "Failed to create job" }, { status: 500 })
  }

  try {
    const result = await runDiscoveryJob(service, job.id, query)
    return NextResponse.json({ success: true, job: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
