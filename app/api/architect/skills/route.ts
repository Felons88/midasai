import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * GET /api/architect/skills?q=photo,gps,offline
 * Returns real skills from the MidasAI listings DB matching the keywords,
 * with install commands attached.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") ?? ""
    const keywords = q.split(",").map(k => k.trim().toLowerCase()).filter(Boolean)

    const supabase = createServiceClient()

    // Use Postgres full-text search across title, short_description, tags
    const query = supabase
      .from("listings")
      .select(`
        id, title, slug, short_description, github_url, tags,
        listing_install_commands ( command, platform )
      `)
      .eq("type", "SKILL")
      .eq("status", "ACTIVE")
      .not("github_url", "is", null)
      .limit(40)

    // Filter by keyword relevance using ilike on title/tags if keywords provided
    let data: any[] = []
    if (keywords.length > 0) {
      // Build OR filter across keywords on title
      const titleFilter = keywords.map(k => `title.ilike.%${k}%`).join(",")
      const { data: rows, error } = await query.or(titleFilter)
      if (error) throw error
      data = rows ?? []
    } else {
      const { data: rows, error } = await query.order("downloads", { ascending: false })
      if (error) throw error
      data = rows ?? []
    }

    // Deduplicate by id, pick best install command
    const seen = new Set<string>()
    const skills = data
      .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
      .slice(0, 20)
      .map(r => {
        const cmds: any[] = r.listing_install_commands ?? []
        const cliCmd = cmds.find((c: any) => c.platform === "CLI")
        const manualCmd = cmds.find((c: any) => c.platform === "MANUAL")
        const installCommand = cliCmd?.command ?? manualCmd?.command ?? null
        return {
          id: r.id,
          title: r.title,
          slug: r.slug,
          description: r.short_description ?? "",
          githubUrl: r.github_url,
          installCommand,
          tags: r.tags ?? [],
          marketplaceUrl: `https://midasai.com/listing/${r.slug}`,
        }
      })

    return NextResponse.json({ skills })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[architect/skills]", msg)
    return NextResponse.json({ skills: [], error: msg })
  }
}
