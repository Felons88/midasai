import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
  name: z.string().min(1).max(120),
  query: z.string().min(1).max(500),
  sort: z.enum(["stars", "updated", "forks", "help-wanted-issues", "best-match"]).default("stars"),
  order: z.enum(["asc", "desc"]).default("desc"),
  language: z.string().max(50).optional().nullable(),
  topics: z.array(z.string().max(50)).max(20).optional(),
  min_stars: z.number().int().min(0).default(0),
  enabled: z.boolean().default(true),
  schedule_cron: z.string().max(100).optional().nullable(),
})

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from("discovery_queries")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ queries: data ?? [] })
}

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

  const parsed = querySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from("discovery_queries")
    .insert({
      ...parsed.data,
      language: parsed.data.language ?? null,
      topics: parsed.data.topics ?? [],
      schedule_cron: parsed.data.schedule_cron ?? null,
      created_by: auth.user.id,
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ query: data }, { status: 201 })
}
