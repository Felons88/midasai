import { createClient, createServiceClient } from "@/lib/supabase/server"
import { syncListingTags } from "@/lib/listings/tags"
import { NextResponse } from "next/server"
import { z } from "zod"

const tagsSchema = z.object({
  tags: z.array(z.string().max(50)).max(20),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from("listings")
    .select("tags")
    .eq("id", id)
    .maybeSingle()

  return NextResponse.json({ tags: listing?.tags ?? [] })
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

  const { data: listing } = await supabase
    .from("listings")
    .select("id, creator_id")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle()

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = tagsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const service = createServiceClient()
  const tags = await syncListingTags(service, id, parsed.data.tags)

  return NextResponse.json({ tags })
}
