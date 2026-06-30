import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  public: z.boolean().optional(),
})

export async function DELETE(
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

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Collection delete error:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
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

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.description !== undefined) updates.description = parsed.data.description
  if (parsed.data.public !== undefined) updates.public = parsed.data.public

  const { data, error } = await supabase
    .from("collections")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Collection update error:", error)
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 })
  }

  return NextResponse.json({ collection: data })
}
