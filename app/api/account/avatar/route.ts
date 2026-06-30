import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import {
  AVATAR_BUCKET,
  buildAvatarPath,
  getAvatarPublicUrl,
  isAllowedAvatarType,
  avatarMaxBytes,
} from "@/lib/storage/avatars"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Could not parse form data" }, { status: 400 })
  }

  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File required" }, { status: 400 })
  }

  if (file.size > avatarMaxBytes()) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 })
  }

  if (!isAllowedAvatarType(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    )
  }

  const path = buildAvatarPath(user.id, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  // Use service role client for storage to bypass RLS on upload
  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : supabase

  const { error: uploadError } = await storageClient.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error("Avatar upload error:", uploadError)
    return NextResponse.json({ error: uploadError.message || "Upload failed" }, { status: 500 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const publicUrl = getAvatarPublicUrl(supabaseUrl, path)

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  if (updateError) {
    console.error("Avatar profile update error:", updateError)
    return NextResponse.json({ error: updateError.message || "Failed to update profile" }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl, path })
}
