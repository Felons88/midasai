const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i

function isImageUrl(url: string): boolean {
  if (url.startsWith("data:")) return false
  try {
    const parsed = new URL(url)
    return (
      IMAGE_EXT.test(parsed.pathname) ||
      parsed.hostname.includes("githubusercontent.com") ||
      parsed.hostname === "opengraph.githubassets.com"
    )
  } catch {
    return false
  }
}

function resolveReadmeImageUrl(raw: string, owner: string, repo: string, defaultBranch: string): string | null {
  const trimmed = raw.trim().replace(/^<|>$/g, "")
  if (!trimmed || trimmed.startsWith("data:")) return null

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return isImageUrl(trimmed) ? trimmed : null
  }

  const path = trimmed.replace(/^\.\//, "")
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/`
  try {
    const resolved = new URL(path, base).href
    return isImageUrl(resolved) ? resolved : null
  } catch {
    return null
  }
}

export function extractReadmeImageUrls(
  readme: string,
  owner: string,
  repo: string,
  defaultBranch: string
): string[] {
  const found = new Set<string>()

  const markdownImages = readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)
  for (const match of markdownImages) {
    const url = resolveReadmeImageUrl(match[1], owner, repo, defaultBranch)
    if (url) found.add(url)
  }

  const htmlImages = readme.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  for (const match of htmlImages) {
    const url = resolveReadmeImageUrl(match[1], owner, repo, defaultBranch)
    if (url) found.add(url)
  }

  return Array.from(found).slice(0, 8)
}

export function buildGitHubRepoPreviewImages(
  owner: string,
  repo: string,
  ownerAvatarUrl?: string | null
): string[] {
  const images: string[] = [
    `https://opengraph.githubassets.com/1/${owner}/${repo}`,
  ]
  if (ownerAvatarUrl) images.push(ownerAvatarUrl)
  return images
}

export function mergeRepoImageCandidates(...groups: string[][]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const group of groups) {
    for (const url of group) {
      if (!url || seen.has(url)) continue
      seen.add(url)
      merged.push(url)
    }
  }
  return merged.slice(0, 12)
}
