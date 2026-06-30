import type { SupabaseClient } from "@supabase/supabase-js"

const SIGNED_URL_TTL_SECONDS = 3600

export function extractStoragePath(
  urlOrPath: string,
  supabaseUrl: string
): { bucket: string; path: string } | null {
  if (!urlOrPath.includes("/storage/v1/object/")) {
    if (urlOrPath.includes("/") && !urlOrPath.startsWith("http")) {
      return { bucket: "listings", path: urlOrPath }
    }
    return null
  }

  const publicMarker = "/storage/v1/object/public/"
  const signedMarker = "/storage/v1/object/sign/"
  const authMarker = "/storage/v1/object/authenticated/"

  for (const marker of [publicMarker, signedMarker, authMarker]) {
    const idx = urlOrPath.indexOf(marker)
    if (idx === -1) continue
    const rest = urlOrPath.slice(idx + marker.length)
    const slash = rest.indexOf("/")
    if (slash === -1) return null
    const bucket = rest.slice(0, slash)
    const path = rest.slice(slash + 1).split("?")[0]
    return { bucket, path }
  }

  if (supabaseUrl && urlOrPath.startsWith(supabaseUrl)) {
    return null
  }

  return null
}

export async function resolveDownloadUrl(
  service: SupabaseClient,
  urlOrPath: string,
  supabaseUrl: string
): Promise<string> {
  const storage = extractStoragePath(urlOrPath, supabaseUrl)
  if (!storage) return urlOrPath

  const { data, error } = await service.storage
    .from(storage.bucket)
    .createSignedUrl(storage.path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return urlOrPath
  }

  return data.signedUrl
}
