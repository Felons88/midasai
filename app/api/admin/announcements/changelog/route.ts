import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  version: z.string().max(40).optional(),
  action_url: z.string().url().optional().or(z.literal("")),
  action_label: z.string().max(80).optional(),
  target_role: z.enum(["all", "USER", "CREATOR", "ADMIN"]).default("all"),
  also_notify: z.boolean().default(true),
})

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const service = createServiceClient()
  const targetRole = parsed.data.target_role === "all" ? null : parsed.data.target_role

  const { data: announcement, error } = await service
    .from("platform_announcements")
    .insert({
      kind: "CHANGELOG",
      title: parsed.data.title,
      body: parsed.data.body,
      version: parsed.data.version ?? null,
      action_url: parsed.data.action_url || null,
      action_label: parsed.data.action_label || null,
      target_role: targetRole,
      active: true,
      created_by: auth.user.id,
    })
    .select("id, title, version, published_at")
    .single()

  if (error) {
    console.error("Changelog create error:", error)
    return NextResponse.json({ error: "Failed to publish changelog" }, { status: 500 })
  }

  let notified = 0
  if (parsed.data.also_notify) {
    let userQuery = service.from("users").select("id")
    if (targetRole === "ADMIN") {
      userQuery = userQuery.in("role", ["ADMIN", "OWNER", "MODERATOR"])
    } else if (targetRole === "CREATOR") {
      userQuery = userQuery.in("role", ["CREATOR", "ADMIN", "OWNER"])
    } else if (targetRole) {
      userQuery = userQuery.eq("role", targetRole)
    }

    const { data: users } = await userQuery
    if (users?.length) {
      const summary =
        parsed.data.version != null
          ? `Version ${parsed.data.version}: ${parsed.data.title}`
          : parsed.data.title
      const rows = users.map((u) => ({
        user_id: u.id,
        title: "What's new",
        message: summary,
        type: "ANNOUNCEMENTS" as const,
        priority: "NORMAL",
        read: false,
        action_url: parsed.data.action_url || "/dashboard",
        action_label: parsed.data.action_label || "Learn more",
        metadata: {
          changelog_id: announcement.id,
          changelog_title: parsed.data.title,
          changelog_body: parsed.data.body,
          changelog_version: parsed.data.version ?? null,
        },
      }))

      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200)
        const { error: notifyError } = await service.from("notifications").insert(chunk)
        if (!notifyError) notified += chunk.length
      }
    }
  }

  return NextResponse.json({ success: true, announcement, notified })
}
