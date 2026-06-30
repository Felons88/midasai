import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from("api_keys")
      .select("user_id, name")
      .eq("id", id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("api_keys")
      .update({
        status: "REVOKED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabase.from("api_logs").insert({
      user_id: user.id,
      api_key_id: id,
      level: "INFO",
      message: `API key revoked: ${existing.name}`,
      metadata: { revoked_at: new Date().toISOString() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[keys/[id]/revoke]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
