import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
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

  const { data, error } = await supabase
    .from("platform_announcements")
    .select("id, title, body, version, action_url, action_label, published_at")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ announcement: data })
}
