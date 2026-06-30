const LISTING_MEDIA_BUCKET = "listings"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
])

const MAX_BYTES = 10 * 1024 * 1024

export function isAllowedListingMediaType(mime: string) {
  return ALLOWED_MIME_TYPES.has(mime)
}

export function listingMediaMaxBytes() {
  return MAX_BYTES
}

export function buildListingMediaPath(
  userId: string,
  listingId: string,
  filename: string
) {
  const ext = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase() ?? "bin"
    : "bin"
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin"
  return `${userId}/${listingId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`
}

export function getListingMediaPublicUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${LISTING_MEDIA_BUCKET}/${path}`
}

export { LISTING_MEDIA_BUCKET }
