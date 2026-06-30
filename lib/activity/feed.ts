import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/server"

type ActivityInput = {
  actorId?: string | null
  eventType: string
  entityType: string
  entityId?: string | null
  entityTitle?: string | null
  metadata?: Record<string, unknown>
  isPublic?: boolean
}

export async function logActivity(
  input: ActivityInput,
  service?: SupabaseClient
) {
  const client = service ?? createServiceClient()

  const { error } = await client.from("activity_feed").insert({
    actor_id: input.actorId ?? null,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_title: input.entityTitle ?? null,
    metadata: input.metadata ?? null,
    is_public: input.isPublic ?? true,
  })

  if (error) {
    console.error("Activity feed log error:", error)
  }
}

export async function fetchPublicActivity(limit = 20) {
  const service = createServiceClient()
  const { data, error } = await service
    .from("activity_feed")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Activity feed fetch error:", error)
    return []
  }

  return data ?? []
}

export async function fetchCreatorActivity(actorId: string, limit = 15) {
  const service = createServiceClient()
  const { data, error } = await service
    .from("activity_feed")
    .select("*")
    .eq("actor_id", actorId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Creator activity fetch error:", error)
    return []
  }

  return data ?? []
}
