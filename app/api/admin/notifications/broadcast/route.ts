import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  target: z.enum(["all", "USER", "CREATOR", "ADMIN"]).default("all"),
  action_url: z.string().url().optional().or(z.literal("")),
  action_label: z.string().max(80).optional(),
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
  let userQuery = service.from("users").select("id")

  if (parsed.data.target !== "all") {
    if (parsed.data.target === "ADMIN") {
      userQuery = userQuery.in("role", ["ADMIN", "OWNER", "MODERATOR"])
    } else {
      userQuery = userQuery.eq("role", parsed.data.target)
    }
  }

  const { data: users, error: usersError } = await userQuery
  if (usersError || !users?.length) {
    return NextResponse.json({ error: "No users matched target" }, { status: 400 })
  }

  const rows = users.map((u) => ({
    user_id: u.id,
    title: parsed.data.title,
    message: parsed.data.message,
    type: "ANNOUNCEMENTS" as const,
    priority: "normal",
    read: false,
    action_url: parsed.data.action_url || null,
    action_label: parsed.data.action_label || null,
    metadata: { broadcast_by: auth.user.id },
  }))

  const batchSize = 200
  let sent = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize)
    const { error } = await service.from("notifications").insert(chunk)
    if (error) {
      console.error("Broadcast insert error:", error)
      return NextResponse.json(
        { error: "Broadcast failed partway", sent },
        { status: 500 }
      )
    }
    sent += chunk.length
  }

  return NextResponse.json({ success: true, sent })
}
