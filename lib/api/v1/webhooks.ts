import { NextRequest } from "next/server"
import { randomBytes } from "crypto"
import { z } from "zod"
import { authenticateApiKey } from "@/lib/api/api-key-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { jsonError, jsonOk, requirePermission, scheduleUsageLog } from "@/lib/api/v1/shared"

const createSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().max(500),
  events: z.array(z.string()).min(1).max(20),
})

const WEBHOOK_FIELDS =
  "id, name, url, events, status, last_delivery_at, total_deliveries, failed_deliveries, created_at"

export async function handleV1WebhooksGet(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "read", auth.rateLimit)
  if (denied) return denied

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("webhooks")
    .select(WEBHOOK_FIELDS)
    .eq("user_id", auth.ctx.userId)
    .order("created_at", { ascending: false })

  if (error) {
    scheduleUsageLog(auth.ctx, request, "/v1/webhooks", 500, Date.now() - started)
    return jsonError("Failed to load webhooks", 500, auth.rateLimit)
  }

  scheduleUsageLog(auth.ctx, request, "/v1/webhooks", 200, Date.now() - started)
  return jsonOk({ data: data ?? [] }, auth.rateLimit)
}

export async function handleV1WebhooksPost(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "write", auth.rateLimit)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400, auth.rateLimit)
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid input", 400, auth.rateLimit)
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      user_id: auth.ctx.userId,
      name: parsed.data.name,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
      status: "ACTIVE",
    })
    .select("id, name, url, events, status, created_at")
    .single()

  if (error) {
    scheduleUsageLog(auth.ctx, request, "/v1/webhooks", 500, Date.now() - started)
    return jsonError("Failed to create webhook", 500, auth.rateLimit)
  }

  scheduleUsageLog(auth.ctx, request, "/v1/webhooks", 201, Date.now() - started)
  return jsonOk({ data, secret }, auth.rateLimit, undefined, 201)
}

export async function handleV1WebhookDelete(request: NextRequest, id: string) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "delete", auth.rateLimit)
  if (denied) return denied

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.ctx.userId)

  if (error) {
    scheduleUsageLog(auth.ctx, request, `/v1/webhooks/${id}`, 500, Date.now() - started)
    return jsonError("Failed to delete webhook", 500, auth.rateLimit)
  }

  scheduleUsageLog(auth.ctx, request, `/v1/webhooks/${id}`, 200, Date.now() - started)
  return jsonOk({ deleted: true }, auth.rateLimit)
}
