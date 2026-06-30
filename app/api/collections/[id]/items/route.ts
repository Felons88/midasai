import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const itemSchema = z.object({
  listingId: z.string().uuid(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = itemSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", user.id)
    .single()

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 })
  }

  const { error } = await supabase.from("collection_items").upsert(
    {
      collection_id: collectionId,
      listing_id: parsed.data.listingId,
      added_at: new Date().toISOString(),
    },
    { onConflict: "collection_id,listing_id" }
  )

  if (error) {
    console.error("Collection item add error:", error)
    return NextResponse.json({ error: "Failed to add listing" }, { status: 500 })
  }

  await supabase
    .from("collections")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", collectionId)

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get("listingId")

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 })
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", user.id)
    .single()

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("listing_id", listingId)

  if (error) {
    console.error("Collection item remove error:", error)
    return NextResponse.json({ error: "Failed to remove listing" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
