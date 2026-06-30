const AVATAR_BUCKET = "avatars"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const MAX_BYTES = 2 * 1024 * 1024

export function isAllowedAvatarType(mime: string) {
  return ALLOWED_MIME_TYPES.has(mime)
}

export function avatarMaxBytes() {
  return MAX_BYTES
}

export function buildAvatarPath(userId: string, filename: string) {
  const ext = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg"
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg"
  return `${userId}/avatar-${Date.now()}.${safeExt}`
}

export function getAvatarPublicUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`
}

export { AVATAR_BUCKET }
