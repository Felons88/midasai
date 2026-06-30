export type ListingMediaItem = {
  id: string
  type: "image" | "video" | "embed"
  url: string
  embedUrl?: string
  label?: string
}

function parseEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  return null
}

function pushMedia(
  media: ListingMediaItem[],
  url: string,
  index: number,
  prefix: string,
  label?: string,
  mimeType?: string
) {
  if (!url) return

  const embedUrl = parseEmbedUrl(url)
  if (embedUrl) {
    media.push({
      id: `${prefix}-embed-${index}`,
      type: "embed",
      url,
      embedUrl,
      label,
    })
    return
  }

  const isVideo =
    mimeType?.startsWith("video") || /\.(mp4|webm|mov)(\?|$)/i.test(url)

  media.push({
    id: `${prefix}-${index}`,
    type: isVideo ? "video" : "image",
    url,
    label,
  })
}

export function extractListingMedia(
  images: string[] | null | undefined,
  files: unknown
): ListingMediaItem[] {
  const media: ListingMediaItem[] = []

  for (const [index, url] of (images ?? []).entries()) {
    pushMedia(media, url, index, "img")
  }

  if (Array.isArray(files)) {
    for (const [index, file] of files.entries()) {
      const entry = file as { url?: string; type?: string; name?: string }
      if (!entry?.url) continue
      pushMedia(media, entry.url, index, "file", entry.name, entry.type)
    }
  } else if (files && typeof files === "object" && "url" in (files as object)) {
    const entry = files as { url?: string; type?: string; name?: string }
    if (entry.url) {
      pushMedia(media, entry.url, 0, "file", entry.name, entry.type)
    }
  }

  const seen = new Set<string>()
  return media.filter((item) => {
    const key = item.embedUrl ?? item.url
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
