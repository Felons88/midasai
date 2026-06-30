import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// SkillsMP sources — all public GitHub repos
const SKILL_SOURCES = [
  { owner: "anthropics", repo: "skills", path: "skills" },
  { owner: "openclaw", repo: "openclaw", path: "skills" },
  { owner: "nextlevelbuilder", repo: "ui-ux-pro-max-skill", path: "" },
  { owner: "vercel-labs", repo: "agent-skills", path: "skills" },
  { owner: "browser-use", repo: "browser-use", path: "skills" },
  { owner: "Shubhamsaboo", repo: "awesome-llm-apps", path: "skills" },
]

const GITHUB_API = "https://api.github.com"
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const CATEGORY_MAP: Record<string, string> = {
  "frontend": "coding",
  "backend": "coding",
  "ui": "design",
  "ux": "design",
  "browser": "browser-automation",
  "testing": "security",
  "security": "security",
  "devops": "devops",
  "cloud": "cloud",
  "database": "databases",
  "data": "research",
  "ai": "ai-agents",
  "llm": "ai-agents",
  "productivity": "productivity",
  "automation": "automations",
  "documentation": "documentation",
  "writing": "writing",
  "design": "design",
  "marketing": "marketing",
  "finance": "finance",
  "research": "research",
  "coding": "coding",
  "skill": "claude-skills",
  "agent": "ai-agents",
  "mcp": "mcp-servers",
}

async function githubFetch(url: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "MidasAI-Importer/1.0",
  }
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`
  }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${url}`)
  return res.json()
}

async function getRepoTree(owner: string, repo: string): Promise<any[]> {
  try {
    const repoInfo = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}`)
    const branch = repoInfo.default_branch ?? "main"
    const treeRes = await githubFetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    )
    return treeRes.tree ?? []
  } catch {
    return []
  }
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const data = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`)
    if (data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8")
    }
    return null
  } catch {
    return null
  }
}

function guessCategory(title: string, description: string, tags: string[]): string {
  const text = `${title} ${description} ${tags.join(" ")}`.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return category
  }
  return "claude-skills"
}

function parseSkillMarkdown(content: string, filename: string): {
  title: string
  description: string
  short_description: string
  tags: string[]
} {
  const lines = content.split("\n")

  // Title from first H1
  let title = filename.replace(/\.md$/i, "").replace(/[-_]/g, " ")
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/)
    if (match) {
      title = match[1].trim()
      break
    }
  }

  // Short description: first non-empty, non-heading paragraph
  let short_description = ""
  let inBody = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("#")) {
      inBody = true
      continue
    }
    if (inBody && trimmed.length > 20 && !trimmed.startsWith("```") && !trimmed.startsWith("-")) {
      short_description = trimmed.slice(0, 280)
      break
    }
  }

  // Full description
  const description = content.slice(0, 4000)

  // Tags from content keywords
  const tagKeywords = ["claude", "cursor", "windsurf", "mcp", "browser", "coding", "ai", "agent", "python", "javascript", "typescript", "react", "next", "node"]
  const tags = tagKeywords.filter((k) => content.toLowerCase().includes(k))

  return { title, description, short_description, tags }
}

export async function POST(request: NextRequest) {
  // Require admin key
  const adminKey = request.headers.get("x-admin-key")
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const limit = Math.min(body.limit ?? 100, 500)
  const dryRun = body.dry_run === true

  const supabase = await createClient()

  // Get a system creator user
  const { data: sysUser } = await supabase
    .from("users")
    .select("id")
    .order("created_at")
    .limit(1)
    .single()

  if (!sysUser) {
    return NextResponse.json({ error: "No system user found" }, { status: 500 })
  }

  // Get category map
  const { data: categories } = await supabase.from("categories").select("id, slug")
  const catMap = Object.fromEntries((categories ?? []).map((c: any) => [c.slug, c.id]))

  const imported: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  let count = 0

  for (const source of SKILL_SOURCES) {
    if (count >= limit) break

    try {
      const tree = await getRepoTree(source.owner, source.repo)
      const mdFiles = tree.filter((f: any) => {
        if (f.type !== "blob") return false
        if (!f.path.endsWith(".md") && !f.path.endsWith(".MD")) return false
        if (source.path && !f.path.startsWith(source.path)) return false
        const filename = f.path.split("/").pop() ?? ""
        // Skip README, CHANGELOG, LICENSE
        if (/readme|changelog|license|contributing|code_of_conduct/i.test(filename)) return false
        return true
      })

      for (const file of mdFiles) {
        if (count >= limit) break

        const filename = file.path.split("/").pop() ?? ""
        const githubUrl = `https://github.com/${source.owner}/${source.repo}/blob/main/${file.path}`

        // Check if already imported
        const { data: existing } = await supabase
          .from("listings")
          .select("id")
          .eq("github_url", githubUrl)
          .limit(1)

        if (existing && existing.length > 0) {
          skipped.push(filename)
          continue
        }

        const content = await fetchFileContent(source.owner, source.repo, file.path)
        if (!content || content.trim().length < 50) {
          skipped.push(filename)
          continue
        }

        const { title, description, short_description, tags } = parseSkillMarkdown(content, filename)
        const categorySlug = guessCategory(title, short_description, tags)
        const categoryId = catMap[categorySlug] ?? catMap["claude-skills"] ?? null

        const allTags = Array.from(new Set([
          ...tags,
          source.owner,
          source.repo,
          "skill",
          categorySlug,
        ]))

        const payload = {
          title,
          description,
          short_description: short_description || description.slice(0, 280),
          type: "SKILL",
          status: "ACTIVE",
          creator_id: sysUser.id,
          category_id: categoryId,
          github_url: githubUrl,
          readme: content,
          tags: allTags,
          price: 0,
          downloads: 0,
          views: 0,
        }

        if (!dryRun) {
          const { error: insertError } = await supabase.from("listings").insert(payload)
          if (insertError) {
            errors.push(`${filename}: ${insertError.message}`)
            continue
          }
        }

        imported.push(title)
        count++
      }
    } catch (err: any) {
      errors.push(`${source.owner}/${source.repo}: ${err.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    imported: imported.length,
    skipped: skipped.length,
    errors: errors.length,
    titles: imported.slice(0, 20),
    error_list: errors.slice(0, 10),
  })
}

export async function GET(request: NextRequest) {
  // Preview available sources
  return NextResponse.json({
    sources: SKILL_SOURCES.map((s) => ({
      repo: `${s.owner}/${s.repo}`,
      path: s.path || "(root)",
      url: `https://github.com/${s.owner}/${s.repo}`,
    })),
    usage: "POST /api/import/skillsmp with header x-admin-key and body { limit: 100, dry_run: false }",
  })
}
