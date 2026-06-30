import { createClient } from "@/lib/supabase/server"
import { collectionSlugFromName } from "@/lib/collections"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  public: z.boolean().optional(),
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
    .from("collections")
    .select(
      `
      *,
      collection_items(count)
    `
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Collections list error:", error)
    return NextResponse.json({ error: "Failed to load collections" }, { status: 500 })
  }

  return NextResponse.json({ collections: data ?? [] })
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
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { name, description, public: isPublic } = parsed.data

  const { data, error } = await supabase
    .from("collections")
    .insert({
      name,
      description: description ?? null,
      public: isPublic ?? false,
      slug: collectionSlugFromName(name),
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Collection create error:", error)
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
  }

  return NextResponse.json({ collection: data }, { status: 201 })
}
