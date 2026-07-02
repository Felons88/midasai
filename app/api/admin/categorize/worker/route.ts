import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getNextPendingJob, runCategorizationJob } from "@/lib/categorization/service"

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

function isAuthorizedBySecret(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) return false
  const adminKey = request.headers.get("x-admin-key")
  return adminKey === secret
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const authorized = (await isAdmin(supabase)) || isAuthorizedBySecret(request)

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const batchSize = Math.min(Number(body.batchSize ?? 5), 20)
  const service = createServiceClient()

  const results = { processed: 0, succeeded: 0, failed: 0 }

  for (let i = 0; i < batchSize; i++) {
    const job = await getNextPendingJob(service)
    if (!job) break

    results.processed++
    const result = await runCategorizationJob(service, job.id)
    if (result.success) {
      results.succeeded++
    } else {
      results.failed++
      console.error(`[Categorization Worker] Job ${job.id} failed: ${result.error}`)
    }
  }

  return NextResponse.json(results)
}
