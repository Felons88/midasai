import { NextRequest } from "next/server"
import { z } from "zod"
import { authenticateApiKey } from "@/lib/api/api-key-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { jsonError, jsonOk, requirePermission, scheduleUsageLog } from "@/lib/api/v1/shared"

const PUBLIC_USER_FIELDS =
  "id, name, email, avatar_url, bio, github_username, role, created_at, website"

const updateMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().max(2000).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
  github_username: z.string().max(80).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
})

export async function handleV1UsersMeGet(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "read", auth.rateLimit)
  if (denied) return denied

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("users")
    .select(PUBLIC_USER_FIELDS)
    .eq("id", auth.ctx.userId)
    .maybeSingle()

  if (error || !data) {
    scheduleUsageLog(auth.ctx, request, "/v1/users/me", 404, Date.now() - started)
    return jsonError("User not found", 404, auth.rateLimit)
  }

  scheduleUsageLog(auth.ctx, request, "/v1/users/me", 200, Date.now() - started)
  return jsonOk({ data }, auth.rateLimit)
}

export async function handleV1UsersMePut(request: NextRequest) {
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

  const parsed = updateMeSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid input", 400, auth.rateLimit)
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("users")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", auth.ctx.userId)
    .select(PUBLIC_USER_FIELDS)
    .single()

  if (error) {
    scheduleUsageLog(auth.ctx, request, "/v1/users/me", 500, Date.now() - started)
    return jsonError("Failed to update profile", 500, auth.rateLimit)
  }

  scheduleUsageLog(auth.ctx, request, "/v1/users/me", 200, Date.now() - started)
  return jsonOk({ data }, auth.rateLimit)
}

export async function handleV1UserByIdGet(request: NextRequest, id: string) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "read", auth.rateLimit)
  if (denied) return denied

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, bio, github_username, role, created_at, website")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    scheduleUsageLog(auth.ctx, request, `/v1/users/${id}`, 404, Date.now() - started)
    return jsonError("User not found", 404, auth.rateLimit)
  }

  scheduleUsageLog(auth.ctx, request, `/v1/users/${id}`, 200, Date.now() - started)
  return jsonOk({ data }, auth.rateLimit)
}
