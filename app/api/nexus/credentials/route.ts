import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("nexus_credentials")
    .select("id, provider, name, masked, created_at, updated_at")
    .eq("user_id", user.id)
    .order("provider")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credentials: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { provider, name, value } = body

  if (!provider || !name || !value) {
    return NextResponse.json({ error: "provider, name, and value are required" }, { status: 400 })
  }
  if (typeof value !== "string" || value.length < 4) {
    return NextResponse.json({ error: "value must be at least 4 characters" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("nexus_credentials")
    .insert({ user_id: user.id, provider, name, value })
    .select("id, provider, name, masked, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credential: data }, { status: 201 })
}
