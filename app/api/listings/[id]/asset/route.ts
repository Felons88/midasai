import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  buildListingAssetPath,
  getListingAssetPublicUrl,
  isAllowedListingAssetType,
  LISTING_ASSET_BUCKET,
  listingAssetMaxBytes,
} from "@/lib/storage/listing-assets"

async function requireListingOwner(listingId: string, userId: string) {
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from("listings")
    .select("id, files")
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

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File required" }, { status: 400 })
  }

  if (file.size > listingAssetMaxBytes()) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
  }

  if (!isAllowedListingAssetType(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  }

  const path = buildListingAssetPath(user.id, listingId, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(LISTING_ASSET_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error("Asset upload error:", uploadError)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const publicUrl = getListingAssetPublicUrl(supabaseUrl, path)

  const files = [
    {
      url: publicUrl,
      path,
      name: file.name,
      type: file.type,
      size: file.size,
    },
  ]

  const { error: updateError } = await supabase
    .from("listings")
    .update({ files })
    .eq("id", listingId)

  if (updateError) {
    return NextResponse.json({ error: "Failed to attach asset" }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl, path, files })
}
