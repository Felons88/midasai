import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

const settingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  language: z.string().max(10).optional(),
  theme: z.string().max(20).optional(),
})

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }

  return NextResponse.json({
    settings: data ?? {
      email_notifications: true,
      marketing_emails: false,
      language: "en",
      theme: "dark",
    },
  })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const payload = {
    ...parsed.data,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}

export async function DELETE() {
  const { user } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: collections } = await service
    .from("collections")
    .select("id")
    .eq("user_id", user.id)

  if (collections?.length) {
    const ids = collections.map((c) => c.id)
    await service.from("collection_items").delete().in("collection_id", ids)
  }

  await service.from("listings").delete().eq("creator_id", user.id)

  const tablesWithUserId = [
    "bookmarks",
    "notifications",
    "collections",
    "api_keys",
    "api_usage",
    "downloads",
    "reviews",
    "user_settings",
    "github_connections",
    "creators",
  ] as const

  for (const table of tablesWithUserId) {
    await service.from(table).delete().eq("user_id", user.id)
  }

  await service.from("follows").delete().eq("follower_id", user.id)
  await service.from("follows").delete().eq("following_id", user.id)
  await service.from("messages").delete().eq("sender_id", user.id)
  await service.from("messages").delete().eq("receiver_id", user.id)

  await service.from("users").delete().eq("id", user.id)

  const { error: authError } = await service.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error("Auth delete error:", authError)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
