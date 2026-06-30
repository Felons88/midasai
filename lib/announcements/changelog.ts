import { createServiceClient } from "@/lib/supabase/server"
import type { PendingChangelog } from "@/lib/announcements/types"

export type { PendingChangelog } from "@/lib/announcements/types"

const ADMIN_ROLES = new Set(["ADMIN", "OWNER", "MODERATOR"])

export function roleMatchesAnnouncementTarget(
  userRole: string,
  targetRole: string | null
): boolean {
  if (!targetRole) return true
  if (targetRole === "ADMIN") return ADMIN_ROLES.has(userRole)
  return userRole === targetRole
}

export async function getPendingChangelogForUser(
  userId: string,
  userRole: string
): Promise<PendingChangelog | null> {
  const db = createServiceClient()

  const { data: announcements, error } = await db
    .from("platform_announcements")
    .select("id, title, body, version, action_url, action_label, published_at, target_role")
    .eq("active", true)
    .eq("kind", "CHANGELOG")
    .order("published_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("getPendingChangelogForUser:", error)
    return null
  }

  const { data: reads } = await db
    .from("platform_announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId)

  const seen = new Set((reads ?? []).map((r) => r.announcement_id))

  const pending = (announcements ?? []).find(
    (a) => !seen.has(a.id) && roleMatchesAnnouncementTarget(userRole, a.target_role)
  )

  if (!pending) return null

  return {
    id: pending.id,
    title: pending.title,
    body: pending.body,
    version: pending.version,
    action_url: pending.action_url,
    action_label: pending.action_label,
    published_at: pending.published_at,
  }
}

export async function recordChangelogAcknowledgement(
  userId: string,
  announcementId: string,
  action: "confirmed" | "dismissed" | "learn_more"
) {
  const db = createServiceClient()
  const now = new Date().toISOString()

  const { error: readError } = await db.from("platform_announcement_reads").upsert(
    {
      user_id: userId,
      announcement_id: announcementId,
      dismissed_at: now,
      confirmed_at: action === "confirmed" || action === "learn_more" ? now : null,
      action,
    },
    { onConflict: "user_id,announcement_id" }
  )

  if (readError) {
    console.error("recordChangelogAcknowledgement:", readError)
    return { ok: false as const, error: readError.message }
  }

  await db.from("analytics_events").insert({
    event: "changelog_acknowledged",
    user_id: userId,
    properties: {
      announcement_id: announcementId,
      action,
    },
  })

  return { ok: true as const }
}
