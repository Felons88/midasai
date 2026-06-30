import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      content,
      subject,
      read,
      created_at,
      sender_id,
      receiver_id,
      sender:users!messages_sender_id_fkey(id, name, avatar_url, email),
      receiver:users!messages_receiver_id_fkey(id, name, avatar_url, email)
    `
    )
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Messages list error:", error)
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }

  return NextResponse.json({ messages: data ?? [] })
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
  const parsed = sendSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { receiverId, subject, content } = parsed.data

  if (receiverId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      subject: subject ?? null,
      content,
      read: false,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Message send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
