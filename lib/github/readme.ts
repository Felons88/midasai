export function toReadmeMdUrl(githubUrl: string): string {
  let url = githubUrl.trim().replace(/\/$/, "")

  // Already points at a README file
  if (url.toLowerCase().endsWith("readme.md")) {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/")
  }

  url = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/")
    .replace("/tree/", "/")

  return `${url}/README.md`
}

export async function fetchGitHubReadme(githubUrl: string): Promise<string | null> {
  const base = githubUrl
    .trim()
    .replace(/\/$/, "")
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/")
    .replace("/tree/", "/")

  const candidates = ["README.md", "Readme.md", "readme.md"]

  for (const file of candidates) {
    try {
      const res = await fetch(`${base}/${file}`, {
        headers: { "User-Agent": "MidasAI-Bot/1.0" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 300 },
      })

      if (res.ok) {
        const text = await res.text()
        return text.slice(0, 100_000)
      }
    } catch {
      // Try next README casing
    }
  }

  return null
}
