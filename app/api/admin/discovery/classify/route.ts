import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { classifyAndStoreRepository } from "@/lib/discovery/classify"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  repository_id: z.string().uuid(),
})

export const maxDuration = 120

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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceClient()
  const { success, error } = await classifyAndStoreRepository(service, parsed.data.repository_id)

  if (!success) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  const { data: unclassified, error } = await service
    .from("discovered_repositories")
    .select("id")
    .not("id", "in", service.from("repository_classifications").select("repository_id"))
    .limit(25)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []
  for (const repo of unclassified ?? []) {
    const result = await classifyAndStoreRepository(service, repo.id)
    results.push({ repository_id: repo.id, ...result })
  }

  return NextResponse.json({ classified: results.length, results })
}
