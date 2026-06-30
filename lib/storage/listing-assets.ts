const LISTING_ASSET_BUCKET = "listings"

const ALLOWED_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-tar",
  "application/octet-stream",
  "text/plain",
  "application/json",
])

const MAX_BYTES = 50 * 1024 * 1024

export function isAllowedListingAssetType(mime: string) {
  return ALLOWED_MIME_TYPES.has(mime) || mime.startsWith("text/")
}

export function listingAssetMaxBytes() {
  return MAX_BYTES
}

export function buildListingAssetPath(
  userId: string,
  listingId: string,
  filename: string
) {
  const ext = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase() ?? "bin"
    : "bin"
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin"
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80)
  return `${userId}/${listingId}/assets/${Date.now()}-${safeName || `file.${safeExt}`}`
}

export function getListingAssetPublicUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${LISTING_ASSET_BUCKET}/${path}`
}

export { LISTING_ASSET_BUCKET }
