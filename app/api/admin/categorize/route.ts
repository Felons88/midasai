import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { bulkQueueCategorization, getCategorizationStatus } from "@/lib/categorization/service"
import { z } from "zod"

const bulkSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
})

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: role } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  return role?.role === "ADMIN" || role?.role === "OWNER" || role?.role === "MODERATOR"
}

export async function POST(request: Request) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = bulkSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const service = createServiceClient()
  const { queued, error } = await bulkQueueCategorization(service, parsed.data)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  const status = await getCategorizationStatus(service)

  return NextResponse.json({ queued, status })
}

export async function GET() {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = createServiceClient()
  const status = await getCategorizationStatus(service)

  if (status.error) {
    return NextResponse.json({ error: status.error }, { status: 500 })
  }

  return NextResponse.json(status)
}
