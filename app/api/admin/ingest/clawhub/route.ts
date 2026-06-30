import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { importClawHubSkills } from "@/lib/ingestion/clawhub"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  status: z.enum(["PENDING", "ACTIVE"]).optional(),
  fetchDetail: z.boolean().optional(),
})

export const maxDuration = 120

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // empty body ok
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  try {
    const service = createServiceClient()
    const result = await importClawHubSkills(service, parsed.data)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("ClawHub import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    )
  }
}
