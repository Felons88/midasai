import { createClient, createServiceClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity/feed"
import { NextResponse } from "next/server"
import { z } from "zod"

const followSchema = z.object({
  followingId: z.string().uuid(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const followingId = searchParams.get("followingId")
  const mode = searchParams.get("mode")

  if (mode === "followers") {
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        id,
        created_at,
        follower:users!follows_follower_id_fkey(
          id,
          name,
          email,
          avatar_url,
          bio
        )
      `
      )
      .eq("following_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to load followers" }, { status: 500 })
    }

    return NextResponse.json({
      followers: (data ?? []).map((row) => ({
        id: row.id,
        followedAt: row.created_at,
        user: row.follower,
      })),
      total: data?.length ?? 0,
    })
  }

  if (followingId) {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .maybeSingle()

    return NextResponse.json({ following: Boolean(data) })
  }

  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to load follows" }, { status: 500 })
  }

  return NextResponse.json({ followingIds: (data ?? []).map((f) => f.following_id) })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = followSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { followingId } = parsed.data

  if (followingId === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: followingId,
  })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: true, following: true })
    }
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 })
  }

  const service = createServiceClient()

  const { data: creatorProfile } = await service
    .from("creators")
    .select("slug")
    .eq("user_id", followingId)
    .maybeSingle()

  await service.from("notifications").insert({
    user_id: followingId,
    title: "New follower",
    message: "You have a new follower",
    read: false,
    priority: "normal",
    type: "MARKETPLACE",
    action_url: creatorProfile?.slug ? `/creator/${creatorProfile.slug}` : null,
    action_label: "View profile",
    metadata: { follower_id: user.id },
  })

  await logActivity(
    {
      actorId: user.id,
      eventType: "creator_followed",
      entityType: "creator",
      entityId: followingId,
    },
    service
  )

  return NextResponse.json({ success: true, following: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const followingId = searchParams.get("followingId")

  if (!followingId) {
    return NextResponse.json({ error: "followingId required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId)

  if (error) {
    return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 })
  }

  return NextResponse.json({ success: true, following: false })
}
