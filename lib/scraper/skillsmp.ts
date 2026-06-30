/**
 * SkillsMP API client library
 *
 * Uses the official SkillsMP REST API:
 *   GET https://skillsmp.com/api/v1/skills/search?q=KEYWORD&page=N
 *   Authorization: Bearer SKILLSMP_API_KEY
 *
 * Strategy:
 *   1. Search across a broad set of keywords covering all categories
 *   2. Paginate through results (up to 2 pages per keyword = 40 skills)
 *   3. Optionally fetch GitHub SKILL.md content for richer descriptions
 *   4. Upsert into listings, deduplicating by skillUrl
 */

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

export interface SkillsmpApiSkill {
  id: string
  name: string
  author: string
  description: string
  githubUrl: string
  skillUrl: string
  stars: number
  updatedAt: string   // unix timestamp string
}

export interface SkillsmpApiResponse {
  success: boolean
  data: {
    skills: SkillsmpApiSkill[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

// Keep legacy export for any remaining usages
export interface SkillsmpSkill {
  skillsmpUrl: string
  slug: string
  owner: string
  repo: string
  title: string
  description: string
  stars: number
  updatedAt: string
  category: string
  githubUrl: string | null
  rawContent: string | null
  tags: string[]
}

// ---------------------------------------------------------------------------
// Official API — search-based bulk import
// ---------------------------------------------------------------------------

const SKILLSMP_API_BASE = "https://skillsmp.com/api/v1"

/**
 * Broad keyword list to cover all categories via the search API.
 * Each keyword yields up to 2 pages × 20 results = 40 skills.
 * With 500 req/day limit, keep to ~40 keywords max per run.
 */
export const SEARCH_KEYWORDS = [
  // Core AI/agent
  "claude", "codex", "agent", "mcp", "llm", "prompt",
  // Development
  "frontend", "backend", "fullstack", "typescript", "python", "react",
  "node", "api", "database", "testing", "debugging", "security",
  // DevOps / cloud
  "devops", "docker", "kubernetes", "cicd", "cloud", "terraform",
  // Productivity
  "automation", "productivity", "workflow", "research", "marketing",
  // Content
  "writing", "design", "documentation", "education", "finance",
  // Misc high-volume
  "github", "git", "data", "mobile", "scripting",
]

/**
 * Fetch one page of search results from the official API.
 */
export async function fetchSkillsmpPage(
  keyword: string,
  page = 1,
  apiKey: string,
): Promise<SkillsmpApiResponse | null> {
  const url = `${SKILLSMP_API_BASE}/skills/search?q=${encodeURIComponent(keyword)}&page=${page}&sortBy=stars`
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return res.json() as Promise<SkillsmpApiResponse>
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Legacy HTML scraping (kept for backwards compatibility, prefer API above)
// ---------------------------------------------------------------------------

/** Returns all leaf-level category slugs from /categories page */
export async function fetchAllCategorySlugs(): Promise<{ slug: string; count: number }[]> {
  const res = await fetchWithRetry("https://skillsmp.com/categories")
  if (!res) return []
  const html = await res.text()

  const results: { slug: string; count: number }[] = []
  // href="/categories/{slug}"  followed by count
  const pattern = /href="\/categories\/([a-z0-9-]+)"[^>]*>[^<]*(\d[\d,]*)\s*skills?/gi
  let m
  const seen = new Set<string>()
  while ((m = pattern.exec(html)) !== null) {
    const slug = m[1]
    const count = parseInt(m[2].replace(/,/g, ""), 10)
    if (!seen.has(slug) && slug !== "tools" && slug !== "business" && slug !== "development"
        && slug !== "testing-security" && slug !== "data-ai" && slug !== "devops"
        && slug !== "documentation" && slug !== "content-media") {
      seen.add(slug)
      results.push({ slug, count })
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Category page scraping — extracts skill rows with pagination
// ---------------------------------------------------------------------------

interface RawSkillRow {
  slug: string
  owner: string
  repo: string
  description: string
  stars: number
  updatedAt: string
  skillsmpPath: string  // /creators/...
}

/** Parse all skill rows out of a category page's HTML */
function parseSkillRows(html: string, categorySlug: string): RawSkillRow[] {
  const rows: RawSkillRow[] = []
  const seen = new Set<string>()

  /**
   * Pattern matches the text clusters from SkillsMP:
   *   [slug  stars  owner/repo  description  date]( /creators/owner/repo/slug )
   *
   * We look for href="/creators/{owner}/{repo}/{slug}" and then capture
   * surrounding text context to extract description and stars.
   *
   * SkillsMP renders each row as a single <a> whose text content is:
   *   {slug}{stars}{owner}/{repo}{description}{date}
   */
  const linkRe = /href="(\/creators\/([^/"]+)\/([^/"]+)\/([^/"]+))"/g
  let m
  while ((m = linkRe.exec(html)) !== null) {
    const [, path, owner, repo, slug] = m
    const key = `${owner}/${repo}/${slug}`
    if (seen.has(key)) continue

    // Grab up to 2000 chars around this link for context
    const start = Math.max(0, m.index - 800)
    const end = Math.min(html.length, m.index + 1200)
    const ctx = html.slice(start, end)

    // Extract description from og-style content near the link
    // The text between the anchor tags contains: slug + stars + owner/repo + desc + date
    const innerMatch = html.slice(m.index).match(/>([^<]{10,1500})<\/a>/)
    let description = ""
    let stars = 0
    let updatedAt = ""

    if (innerMatch) {
      // Strip the slug from the start, strip trailing date pattern
      let raw = innerMatch[1].trim()
      // Remove slug prefix
      raw = raw.replace(new RegExp(`^${slug.replace(/[-]/g, "[- ]?")}`, "i"), "").trim()
      // Extract star count (e.g. 154.5k or 380.1k)
      const starsMatch = raw.match(/^([\d.]+[km]?)/i)
      if (starsMatch) {
        stars = parseStars(starsMatch[1])
        raw = raw.slice(starsMatch[0].length).trim()
      }
      // Remove owner/repo prefix
      raw = raw.replace(new RegExp(`^${owner}\\s*/\\s*${repo}`, "i"), "").trim()
      // Extract trailing date (YYYY-MM-DD)
      const dateMatch = raw.match(/(\d{4}-\d{2}-\d{2})\s*$/)
      if (dateMatch) {
        updatedAt = dateMatch[1]
        raw = raw.slice(0, raw.length - dateMatch[0].length).trim()
      }
      description = raw.slice(0, 500)
    }

    seen.add(key)
    rows.push({ slug, owner, repo, description, stars, updatedAt, skillsmpPath: path })
  }

  return rows
}

function parseStars(s: string): number {
  const lower = s.toLowerCase()
  if (lower.endsWith("k")) return Math.round(parseFloat(lower) * 1000)
  if (lower.endsWith("m")) return Math.round(parseFloat(lower) * 1000000)
  return parseInt(lower.replace(/[^\d]/g, ""), 10) || 0
}

/** Fetch one category page (handles ?page=N param) */
export async function fetchCategoryPage(slug: string, page = 1): Promise<RawSkillRow[]> {
  const url = page === 1
    ? `https://skillsmp.com/categories/${slug}`
    : `https://skillsmp.com/categories/${slug}?page=${page}`
  const res = await fetchWithRetry(url)
  if (!res) return []
  const html = await res.text()
  return parseSkillRows(html, slug)
}

// ---------------------------------------------------------------------------
// Individual skill page — extract GitHub URL from Manus button
// ---------------------------------------------------------------------------

/**
 * Returns the GitHub tree URL, e.g.:
 *   https://github.com/anthropics/skills/tree/main/skills/frontend-design
 */
export async function fetchSkillGithubUrl(skillsmpPath: string): Promise<string | null> {
  const res = await fetchWithRetry(`https://skillsmp.com${skillsmpPath}`)
  if (!res) return null
  const html = await res.text()

  // Manus button contains: githubUrl=https%3A%2F%2Fgithub.com%2F...
  const manusMatch = html.match(/githubUrl=(https%3A%2F%2Fgithub\.com%2F[^"&\s]+)/)
  if (manusMatch) {
    return decodeURIComponent(manusMatch[1])
  }

  // Fallback: look for raw github.com link in page
  const ghMatch = html.match(/href="(https:\/\/github\.com\/[^"]+\/(?:tree|blob)\/[^"]+)"/)
  return ghMatch ? ghMatch[1] : null
}

// ---------------------------------------------------------------------------
// GitHub content fetching
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

function githubHeaders(): HeadersInit {
  const h: HeadersInit = {
    "User-Agent": "MidasAI-Scraper/2.0",
    Accept: "application/vnd.github.v3+json",
  }
  if (GITHUB_TOKEN) h["Authorization"] = `Bearer ${GITHUB_TOKEN}`
  return h
}

/**
 * Given a GitHub tree URL like:
 *   https://github.com/anthropics/skills/tree/main/skills/frontend-design
 * fetch the SKILL.md (or any .md) content inside that directory.
 */
export async function fetchSkillContent(githubTreeUrl: string): Promise<string | null> {
  try {
    // Parse owner/repo/branch/path from URL
    const match = githubTreeUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/(?:tree|blob)\/([^/]+)\/?(.*)$/
    )
    if (!match) return null
    const [, owner, repo, branch, dirPath] = match

    // Try fetching SKILL.md, skill.md, README.md in that directory
    const candidates = dirPath
      ? [`${dirPath}/SKILL.md`, `${dirPath}/skill.md`, `${dirPath}/README.md`, `${dirPath}.md`]
      : ["SKILL.md", "skill.md", "README.md"]

    for (const candidate of candidates) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${candidate}`
      const res = await fetch(rawUrl, {
        headers: { "User-Agent": "MidasAI-Scraper/2.0" },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const text = await res.text()
        if (text.trim().length > 30) return text
      }
    }

    // Last resort: use GitHub API to list directory contents
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath || ""}?ref=${branch}`
    const apiRes = await fetch(apiUrl, {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(10000),
    })
    if (apiRes.ok) {
      const files: any[] = await apiRes.json()
      const mdFile = files.find(
        (f) => f.type === "file" && /\.(md|txt)$/i.test(f.name) &&
               !/readme|changelog|license|contributing/i.test(f.name)
      ) ?? files.find((f) => f.type === "file" && /readme/i.test(f.name))

      if (mdFile?.download_url) {
        const contentRes = await fetch(mdFile.download_url, {
          headers: { "User-Agent": "MidasAI-Scraper/2.0" },
          signal: AbortSignal.timeout(8000),
        })
        if (contentRes.ok) return contentRes.text()
      }
    }

    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Content parsing
// ---------------------------------------------------------------------------

const TAG_KEYWORDS = [
  "claude", "cursor", "windsurf", "codex", "chatgpt", "mcp", "browser",
  "coding", "ai", "agent", "python", "javascript", "typescript", "react",
  "next", "node", "git", "docker", "kubernetes", "security", "testing",
  "devops", "database", "api", "llm", "gpt", "automation", "workflow",
]

export function parseSkillContent(
  content: string,
  fallbackTitle: string
): { title: string; description: string; short_description: string; tags: string[] } {
  const lines = content.split("\n")

  // Title: first H1, or fallback
  let title = fallbackTitle.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/)
    if (m) {
      title = m[1].trim()
      break
    }
  }

  // Short description: first substantial non-heading, non-code paragraph
  let short_description = ""
  let passedFirstHeading = false
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith("#")) { passedFirstHeading = true; continue }
    if (!passedFirstHeading) continue
    if (t.startsWith("```") || t.startsWith("|") || t.startsWith("-") || t.startsWith("*") || t.length < 20) continue
    short_description = t.slice(0, 250)
    break
  }

  // If still no short_description, try first non-empty line after title
  if (!short_description) {
    for (const line of lines.slice(1)) {
      const t = line.trim()
      if (t.length > 20 && !t.startsWith("#") && !t.startsWith("```")) {
        short_description = t.slice(0, 250)
        break
      }
    }
  }

  const lower = content.toLowerCase()
  const tags = TAG_KEYWORDS.filter((k) => lower.includes(k))

  return {
    title,
    description: content.slice(0, 8000),
    short_description: short_description || title,
    tags,
  }
}

// SkillsMP category slug → our DB category_id (real IDs from Supabase)
export const SKILLSMP_TO_CATEGORY_ID: Record<string, string> = {
  // Tools
  "tools":               "45b813e0-2502-4a2a-9928-da2aa34f72a4", // Developer Tools
  "debugging":           "45b813e0-2502-4a2a-9928-da2aa34f72a4", // Developer Tools
  "system-admin":        "c153503d-eb51-495f-96df-dead57876ab8", // DevOps
  "productivity-tools":  "027e6f54-5c75-4a63-810b-f982da261b61", // Productivity
  "automation-tools":    "8ba0f7b2-f6e2-4abd-90eb-6f508354d23b", // Automations
  "ide-plugins":         "45b813e0-2502-4a2a-9928-da2aa34f72a4", // Developer Tools
  "cli-tools":           "45b813e0-2502-4a2a-9928-da2aa34f72a4", // Developer Tools
  "domain-utilities":    "45b813e0-2502-4a2a-9928-da2aa34f72a4", // Developer Tools
  // Business
  "business":            "6a1bc2f3-984a-4a37-b71a-2510cf2d88a4", // Marketing
  "sales-marketing":     "6a1bc2f3-984a-4a37-b71a-2510cf2d88a4", // Marketing
  "project-management":  "027e6f54-5c75-4a63-810b-f982da261b61", // Productivity
  "finance-investment":  "657836e8-a6ca-4fea-bb7c-04e608522acd", // Finance
  "real-estate-legal":   "657836e8-a6ca-4fea-bb7c-04e608522acd", // Finance
  "health-fitness":      "027e6f54-5c75-4a63-810b-f982da261b61", // Productivity
  "payment":             "657836e8-a6ca-4fea-bb7c-04e608522acd", // Finance
  "ecommerce":           "6a1bc2f3-984a-4a37-b71a-2510cf2d88a4", // Marketing
  "business-apps":       "027e6f54-5c75-4a63-810b-f982da261b61", // Productivity
  // Development
  "development":         "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "architecture-patterns":"d784c4b2-8564-4a61-bd50-8cf2b91ad82d",// Coding
  "backend":             "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "frontend":            "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "gaming":              "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "mobile":              "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "scripting":           "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "cms-platforms":       "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "full-stack":          "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "package-distribution":"d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "framework-internals": "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  "ecommerce-development":"d784c4b2-8564-4a61-bd50-8cf2b91ad82d",// Coding
  // Testing & Security
  "testing-security":    "f89b930a-2311-47a4-be2e-35e021b4d747", // Security
  "code-quality":        "f89b930a-2311-47a4-be2e-35e021b4d747", // Security
  "testing":             "f89b930a-2311-47a4-be2e-35e021b4d747", // Security
  "security":            "f89b930a-2311-47a4-be2e-35e021b4d747", // Security
  // Data & AI
  "data-ai":             "13e050c9-17a4-4677-9bb4-06adcb2f82e5", // AI Agents
  "llm-ai":              "13e050c9-17a4-4677-9bb4-06adcb2f82e5", // AI Agents
  "machine-learning":    "13e050c9-17a4-4677-9bb4-06adcb2f82e5", // AI Agents
  "data-engineering":    "25ca03d5-7a65-40f8-a13e-04daaf8eaa0f", // Databases
  "data-analysis":       "3207bea0-d28e-4760-bb6f-aba4c7599e03", // Research
  // DevOps
  "devops":              "c153503d-eb51-495f-96df-dead57876ab8", // DevOps
  "git-workflows":       "c153503d-eb51-495f-96df-dead57876ab8", // DevOps
  "cicd":                "c153503d-eb51-495f-96df-dead57876ab8", // DevOps
  "cloud":               "a7fa9d35-2032-4fd4-9ab9-04b2ebf4b692", // Cloud
  "containers":          "c153503d-eb51-495f-96df-dead57876ab8", // DevOps
  "monitoring":          "c153503d-eb51-495f-96df-dead57876ab8", // DevOps
  // Documentation
  "documentation":       "2e013cbe-727b-44e6-8c7b-18b1046c7b8d", // Documentation
  "knowledge-base":      "2e013cbe-727b-44e6-8c7b-18b1046c7b8d", // Documentation
  "technical-docs":      "2e013cbe-727b-44e6-8c7b-18b1046c7b8d", // Documentation
  "education":           "9b1671a7-5e80-4805-aed0-1d066774367c", // Education
  // Content & Media
  "content-media":       "b59d0c48-e1e0-4b20-b743-5bd41c37e43e", // Writing
  "documents":           "b59d0c48-e1e0-4b20-b743-5bd41c37e43e", // Writing
  "content-creation":    "b59d0c48-e1e0-4b20-b743-5bd41c37e43e", // Writing
  "design":              "9869a481-5d48-4964-895b-6456e4e9d3a9", // Design
  "media":               "b59d0c48-e1e0-4b20-b743-5bd41c37e43e", // Writing
  // Other
  "research":            "3207bea0-d28e-4760-bb6f-aba4c7599e03", // Research
  "lifestyle":           "027e6f54-5c75-4a63-810b-f982da261b61", // Productivity
  "databases":           "25ca03d5-7a65-40f8-a13e-04daaf8eaa0f", // Databases
  "blockchain":          "d784c4b2-8564-4a61-bd50-8cf2b91ad82d", // Coding
  // Fallback
  "default":             "95ca309e-e373-405a-8f57-3edad4e9d861", // Claude Skills
}

// Also keep slug mapping for reference
export const SKILLSMP_TO_OUR_CATEGORY: Record<string, string> = {
  "tools": "developer-tools", "debugging": "developer-tools", "system-admin": "devops",
  "productivity-tools": "productivity", "automation-tools": "automations",
  "ide-plugins": "developer-tools", "cli-tools": "developer-tools",
  "domain-utilities": "developer-tools", "business": "marketing",
  "sales-marketing": "marketing", "project-management": "productivity",
  "finance-investment": "finance", "real-estate-legal": "finance",
  "health-fitness": "productivity", "payment": "finance", "ecommerce": "marketing",
  "business-apps": "productivity", "development": "coding",
  "architecture-patterns": "coding", "backend": "coding", "frontend": "coding",
  "gaming": "coding", "mobile": "coding", "scripting": "coding",
  "cms-platforms": "coding", "full-stack": "coding", "package-distribution": "coding",
  "framework-internals": "coding", "ecommerce-development": "coding",
  "testing-security": "security", "code-quality": "security", "testing": "security",
  "security": "security", "data-ai": "ai-agents", "llm-ai": "ai-agents",
  "machine-learning": "ai-agents", "data-engineering": "databases",
  "data-analysis": "research", "devops": "devops", "git-workflows": "devops",
  "cicd": "devops", "cloud": "cloud", "containers": "devops", "monitoring": "devops",
  "documentation": "documentation", "knowledge-base": "documentation",
  "technical-docs": "documentation", "education": "education",
  "content-media": "writing", "documents": "writing", "content-creation": "writing",
  "design": "design", "media": "writing", "research": "research",
  "lifestyle": "productivity", "databases": "databases", "blockchain": "coding",
}

/**
 * Build a rich, accurate tag list for a skill.
 * Combines SkillsMP category, parsed content keywords, repo/owner, and
 * compatibility tags (claude, cursor, windsurf, etc.)
 */
export function buildTags(opts: {
  skillsmpCategory: string
  ourCategorySlug: string
  owner: string
  repo: string
  slug: string
  content: string
}): string[] {
  const { skillsmpCategory, ourCategorySlug, owner, repo, slug, content } = opts
  const lower = content.toLowerCase()

  const tags = new Set<string>()

  // Category-derived tags
  tags.add(skillsmpCategory.replace(/-/g, " "))
  tags.add(ourCategorySlug.replace(/-/g, " "))

  // Source tags
  tags.add("skillsmp")
  tags.add("claude skill")
  tags.add("skill")
  tags.add(owner)
  if (repo !== owner) tags.add(repo)

  // Compatibility tags based on content
  if (lower.includes("claude")) tags.add("claude")
  if (lower.includes("cursor")) tags.add("cursor")
  if (lower.includes("windsurf")) tags.add("windsurf")
  if (lower.includes("codex")) tags.add("codex")
  if (lower.includes("chatgpt") || lower.includes("openai")) tags.add("chatgpt")
  if (lower.includes("mcp") || lower.includes("model context protocol")) tags.add("mcp")
  if (lower.includes("github copilot")) tags.add("github copilot")

  // Tech stack tags
  const techKeywords = [
    "python", "javascript", "typescript", "react", "next.js", "node", "vue",
    "svelte", "tailwind", "docker", "kubernetes", "aws", "gcp", "azure",
    "postgres", "mysql", "mongodb", "redis", "graphql", "rest", "api",
    "git", "github", "gitlab", "ci/cd", "terraform", "ansible",
    "llm", "gpt", "ai", "ml", "langchain", "openai", "anthropic",
  ]
  for (const kw of techKeywords) {
    if (lower.includes(kw)) tags.add(kw)
  }

  // Category-specific canonical tags
  const catTags: Record<string, string[]> = {
    "debugging":           ["debug", "troubleshoot", "error handling"],
    "frontend":            ["ui", "ux", "web", "html", "css"],
    "backend":             ["server", "api", "database"],
    "security":            ["security", "vulnerability", "audit"],
    "devops":              ["deployment", "infrastructure", "pipeline"],
    "llm-ai":              ["ai", "llm", "prompt", "agent"],
    "data-engineering":    ["data", "etl", "pipeline"],
    "documentation":       ["docs", "readme", "markdown"],
    "testing":             ["test", "qa", "unit test", "e2e"],
    "git-workflows":       ["git", "github", "pull request", "merge"],
    "content-creation":    ["writing", "content", "blog"],
    "design":              ["design", "ui", "ux", "figma"],
    "productivity-tools":  ["productivity", "workflow", "automation"],
    "automation-tools":    ["automation", "script", "workflow"],
    "cloud":               ["cloud", "aws", "gcp", "azure", "serverless"],
    "machine-learning":    ["ml", "model", "training", "neural network"],
  }
  const extra = catTags[skillsmpCategory]
  if (extra) extra.forEach((t) => tags.add(t))

  // Slug words as tags (e.g. "frontend-design" → "frontend", "design")
  slug.split(/[-_]/).filter((w) => w.length > 2).forEach((w) => tags.add(w))

  return Array.from(tags).filter((t) => t.length > 1).slice(0, 30)
}

// ---------------------------------------------------------------------------
// Fetch with retry
// ---------------------------------------------------------------------------

export async function fetchWithRetry(
  url: string,
  maxRetries = 2,
  delayMs = 500
): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MidasAI-Scraper/2.0)",
          Accept: "text/html,*/*",
        },
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) return res
      if (res.status === 404) return null
      if (res.status === 429) {
        await sleep(2000 * (attempt + 1))
        continue
      }
    } catch (err: any) {
      if (attempt === maxRetries) return null
    }
    if (attempt < maxRetries) await sleep(delayMs * (attempt + 1))
  }
  return null
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
