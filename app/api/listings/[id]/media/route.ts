import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const mediaSchema = z.object({
  images: z.array(z.string().url()).max(12).optional(),
  files: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.string().optional(),
        name: z.string().optional(),
      })
    )
    .max(12)
    .optional(),
})

async function requireListingOwner(listingId: string, userId: string) {
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("creator_id", userId)
    .maybeSingle()

  return listing
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const listing = await requireListingOwner(listingId, user.id)
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Multipart form required" }, { status: 400 })
  }

  const {
    buildListingMediaPath,
    getListingMediaPublicUrl,
    isAllowedListingMediaType,
    LISTING_MEDIA_BUCKET,
    listingMediaMaxBytes,
  } = await import("@/lib/storage/listing-media")

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File required" }, { status: 400 })
  }

  if (file.size > listingMediaMaxBytes()) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
  }

  if (!isAllowedListingMediaType(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, or WebM." },
      { status: 400 }
    )
  }

  const path = buildListingMediaPath(user.id, listingId, file.name)

  const { error: uploadError } = await supabase.storage
    .from(LISTING_MEDIA_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Listing media upload error:", uploadError)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const publicUrl = getListingMediaPublicUrl(supabaseUrl, path)
  const isVideo = file.type.startsWith("video/")

  if (!isVideo) {
    const { data: existing } = await supabase
      .from("listings")
      .select("images")
      .eq("id", listingId)
      .eq("creator_id", user.id)
      .maybeSingle()

    const images = [...(existing?.images ?? []), publicUrl].slice(0, 12)
    await supabase
      .from("listings")
      .update({ images })
      .eq("id", listingId)
      .eq("creator_id", user.id)
  }

  return NextResponse.json({
    url: publicUrl,
    path,
    type: file.type,
    name: file.name,
    kind: isVideo ? "video" : "image",
  })
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
  const parsed = mediaSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const updates: { images?: string[]; files?: unknown } = {}
  if (parsed.data.images !== undefined) updates.images = parsed.data.images
  if (parsed.data.files !== undefined) updates.files = parsed.data.files

  const { data, error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select("id, images, files")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ listing: data })
}
