/**
 * POST /api/import/skillsmp/scrape
 *
 * Imports skills from the official SkillsMP REST API.
 * Iterates across search keywords, paginates through results,
 * optionally fetches GitHub SKILL.md, and upserts into listings.
 *
 * Body params:
 *   limit         - max skills to import per run (default 200, max 2000)
 *   dry_run       - if true, parse but don't write to DB
 *   keyword       - optional single keyword to restrict search (default: all keywords)
 *   pages         - how many pages per keyword (default 2, max 10)
 *   fetch_content - if true, also fetch GitHub SKILL.md (default false — API description is enough)
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  fetchSkillsmpPage,
  fetchSkillContent,
  parseSkillContent,
  SKILLSMP_TO_CATEGORY_ID,
  SKILLSMP_TO_OUR_CATEGORY,
  buildTags,
  SEARCH_KEYWORDS,
  sleep,
} from "@/lib/scraper/skillsmp"

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key")
  const secret = process.env.ADMIN_SECRET_KEY
  if (secret && adminKey !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.SKILLSMP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "SKILLSMP_API_KEY not configured" }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const limit: number = Math.min(body.limit ?? 200, 2000)
  const dryRun: boolean = body.dry_run === true
  const keywordFilter: string | undefined = body.keyword ?? body.category
  const maxPages: number = Math.min(body.pages ?? 2, 50)
  const fetchContent: boolean = body.fetch_content === true // default false — API desc is rich enough

  const supabase = await createClient()

  const { data: sysUser } = await supabase
    .from("users")
    .select("id")
    .order("created_at")
    .limit(1)
    .single()

  if (!sysUser) {
    return NextResponse.json({ error: "No system user found" }, { status: 500 })
  }

  const keywords = keywordFilter ? [keywordFilter] : SEARCH_KEYWORDS
  const seen = new Set<string>() // dedup by skillUrl within this run

  const stats = { imported: 0, skipped_duplicate: 0, skipped_no_content: 0, errors: 0 }
  const importedTitles: string[] = []
  const errorList: string[] = []

  outer: for (const keyword of keywords) {
    if (stats.imported >= limit) break

    for (let page = 1; page <= maxPages; page++) {
      if (stats.imported >= limit) break outer

      const result = await fetchSkillsmpPage(keyword, page, apiKey)
      if (!result?.success || !result.data?.skills?.length) break

      for (const skill of result.data.skills) {
        if (stats.imported >= limit) break outer
        if (seen.has(skill.skillUrl)) continue
        seen.add(skill.skillUrl)

        // Dedup against DB by skillUrl stored in source_url, or by githubUrl
        const { data: existing } = await supabase
          .from("listings")
          .select("id")
          .or(`source_url.eq.${skill.skillUrl},github_url.eq.${skill.githubUrl}`)
          .limit(1)

        if (existing && existing.length > 0) {
          stats.skipped_duplicate++
          continue
        }

        // Optionally fetch richer SKILL.md content
        let rawContent: string | null = null
        if (fetchContent && skill.githubUrl) {
          rawContent = await fetchSkillContent(skill.githubUrl).catch(() => null)
          await sleep(200)
        }

        // Build title + description from API data or parsed content
        const fallbackTitle = skill.name.replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())

        let title = fallbackTitle
        let description = skill.description || ""
        let short_description = description.slice(0, 250)
        let contentTags: string[] = []

        if (rawContent && rawContent.trim().length > 30) {
          const parsed = parseSkillContent(rawContent, fallbackTitle)
          title = parsed.title
          description = parsed.description
          short_description = parsed.short_description.slice(0, 250)
          contentTags = parsed.tags
        } else if (description) {
          const parsed = parseSkillContent(description, fallbackTitle)
          title = parsed.title || fallbackTitle
          contentTags = parsed.tags
        }

        if (!title || title.trim().length < 2) {
          stats.skipped_no_content++
          continue
        }

        // Infer category from keyword
        const catSlug = keywordFilter ?? keyword
        const categoryId = SKILLSMP_TO_CATEGORY_ID[catSlug] ?? SKILLSMP_TO_CATEGORY_ID["default"]
        const ourCatSlug = SKILLSMP_TO_OUR_CATEGORY[catSlug] ?? "claude-skills"

        const allTags = buildTags({
          skillsmpCategory: catSlug,
          ourCategorySlug: ourCatSlug,
          owner: skill.author,
          repo: skill.name,
          slug: skill.name,
          content: rawContent ?? description ?? skill.name,
        })

        const updatedAt = skill.updatedAt
          ? new Date(parseInt(skill.updatedAt) * 1000).toISOString()
          : new Date().toISOString()

        const payload = {
          title: title.trim().slice(0, 200),
          description: (rawContent ?? description).slice(0, 8000),
          short_description: short_description.slice(0, 250),
          type: "SKILL" as const,
          status: "ACTIVE" as const,
          creator_id: sysUser.id,
          category_id: categoryId,
          github_url: skill.githubUrl || skill.skillUrl,
          source_url: skill.skillUrl,
          readme: rawContent ?? description,
          tags: allTags,
          price: 0,
          downloads: skill.stars,
          views: Math.round(skill.stars * 2.5),
          updated_at: updatedAt,
        }

        if (!dryRun) {
          const { error: insertError } = await supabase.from("listings").insert(payload)
          if (insertError) {
            if (insertError.code === "23505") {
              stats.skipped_duplicate++
            } else {
              errorList.push(`${skill.name}: ${insertError.message}`)
              stats.errors++
            }
            continue
          }
        }

        importedTitles.push(title)
        stats.imported++
      }

      if (!result.data.pagination.hasNext) break
      await sleep(200) // 30 req/min limit = ~2s/req; 200ms is safe with DB overhead
    }

    await sleep(300)
  }

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    ...stats,
    sample_titles: importedTitles.slice(0, 25),
    errors_list: errorList.slice(0, 20),
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/import/skillsmp/scrape",
    requires: "SKILLSMP_API_KEY env var",
    body: {
      limit: "number (default 200, max 2000) — max skills to import",
      dry_run: "boolean (default false) — parse but do not write to DB",
      keyword: "string (optional) — restrict to one search keyword",
      pages: "number (default 2) — pages per keyword",
      fetch_content: "boolean (default false) — also fetch GitHub SKILL.md",
    },
    examples: [
      { description: "Dry run 40 skills", body: { limit: 40, dry_run: true, keyword: "claude", pages: 1 } },
      { description: "Full import", body: { limit: 500, dry_run: false } },
    ],
  })
}
