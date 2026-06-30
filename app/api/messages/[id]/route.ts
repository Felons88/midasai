import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: message } = await supabase
    .from("messages")
    .select("receiver_id")
    .eq("id", id)
    .single()

  if (!message || message.receiver_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { error } = await supabase.from("messages").update({ read: true }).eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
