import { createClient } from "@/lib/supabase/server"
import { getPendingChangelogForUser } from "@/lib/announcements/changelog"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const announcement = await getPendingChangelogForUser(
    user.id,
    profile?.role ?? "USER"
  )

  return NextResponse.json({ announcement })
}
