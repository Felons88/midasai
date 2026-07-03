import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

const reviewSchema = z.object({
  queue_id: z.string().uuid(),
  action: z.enum(["approve", "reject", "archive"]),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? undefined
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200)
  const offset = Number(searchParams.get("offset") ?? "0")

  const service = createServiceClient()
  let query = service
    .from("import_queue")
    .select("*, discovered_repositories(*), listings(*)", { count: "exact" })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ queue: data ?? [], count: count ?? 0 })
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

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceClient()
  const newStatus =
    parsed.data.action === "approve"
      ? "approved"
      : parsed.data.action === "reject"
        ? "rejected"
        : "archived"

  const { data, error } = await service
    .from("import_queue")
    .update({
      status: newStatus,
      notes: parsed.data.notes ?? null,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.queue_id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ queue_item: data })
}
