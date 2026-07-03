import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GITHUB_API = "https://api.github.com"
const USER_AGENT = "MidasAI-Discovery-Scheduler/1.0"

type DiscoveryQuery = {
  id: string
  name: string
  query: string
  sort: string
  order: string
  language: string | null
  topics: string[] | null
  min_stars: number
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function githubSearch(token: string, query: DiscoveryQuery): Promise<{ items: unknown[] }> {
  const params = new URLSearchParams()
  let q = query.query
  if (query.language) q += ` language:${query.language}`
  if (query.topics) {
    for (const topic of query.topics) q += ` topic:${topic}`
  }
  params.set("q", q)
  params.set("sort", query.sort || "stars")
  params.set("order", query.order || "desc")
  params.set("per_page", "100")

  const res = await fetch(`${GITHUB_API}/search/repositories?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github.v3+json",
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`GitHub search failed: ${res.status} ${body.slice(0, 160)}`)
  }

  return await res.json() as { items: unknown[] }
}

async function upsertRepository(service: any, jobId: string, repo: any, query: DiscoveryQuery) {
  const fullName = repo.full_name as string
  const owner = repo.owner?.login as string
  const name = repo.name as string
  const htmlUrl = repo.html_url as string
  const githubId = repo.id as number

  if (!githubId || !fullName) return { new: false, duplicate: false, error: "invalid repo" }

  const { data: existing } = await service
    .from("discovered_repositories")
    .select("id")
    .eq("github_id", githubId)
    .maybeSingle()

  const repoData = {
    github_id: githubId,
    owner,
    name,
    full_name: fullName,
    description: (repo.description as string) ?? "",
    html_url: htmlUrl,
    default_branch: (repo.default_branch as string) ?? null,
    primary_language: (repo.language as string) ?? null,
    topics: (repo.topics as string[]) ?? [],
    license: (repo.license?.name as string) ?? null,
    stargazers_count: Number(repo.stargazers_count ?? 0),
    forks_count: Number(repo.forks_count ?? 0),
    watchers_count: Number(repo.watchers_count ?? 0),
    open_issues_count: Number(repo.open_issues_count ?? 0),
    pushed_at: (repo.pushed_at as string) ?? null,
    created_at: (repo.created_at as string) ?? null,
    repo_size_kb: Number(repo.size ?? 0),
    has_readme: false,
    homepage: (repo.homepage as string) ?? null,
    owner_avatar_url: (repo.owner?.avatar_url as string) ?? null,
    owner_html_url: (repo.owner?.html_url as string) ?? null,
    metadata: {} as Record<string, unknown>,
    last_seen_at: new Date().toISOString(),
    status: "new",
  }

  if (repo.stargazers_count < query.min_stars) {
    return { new: false, duplicate: false, error: "below min stars" }
  }

  if (existing?.id) {
    await service.from("discovered_repositories").update(repoData).eq("id", existing.id)
    return { new: false, duplicate: true, error: null }
  }

  const { data: inserted } = await service
    .from("discovered_repositories")
    .insert({ ...repoData, first_seen_at: new Date().toISOString() })
    .select("id")
    .single()

  if (inserted?.id) {
    await service.from("import_queue").insert({ repository_id: inserted.id, status: "pending" })
  }

  return { new: true, duplicate: false, error: null }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get("GITHUB_TOKEN")
    if (!token) {
      return new Response(JSON.stringify({ error: "GITHUB_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { data: queries, error: queryError } = await service
      .from("discovery_queries")
      .select("*")
      .eq("enabled", true)

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const results = []
    for (const query of (queries ?? []) as DiscoveryQuery[]) {
      const { data: job, error: jobError } = await service
        .from("discovery_jobs")
        .insert({ query_id: query.id, status: "processing" })
        .select("*")
        .single()

      if (jobError || !job) {
        results.push({ query: query.name, error: jobError?.message || "Failed to create job" })
        continue
      }

      let found = 0
      let newRepos = 0
      let duplicated = 0
      let failed = 0
      let errorMessage: string | null = null

      try {
        const search = await githubSearch(token, query)
        const items = (search.items ?? []).filter((r: any) => !r.fork)
        found = items.length

        for (const repo of items) {
          const { new: isNew, duplicate, error } = await upsertRepository(service, job.id, repo, query)
          if (error) {
            failed++
          } else if (isNew) {
            newRepos++
          } else if (duplicate) {
            duplicated++
          }
        }

        await service.from("discovery_queries").update({ last_run_at: new Date().toISOString() }).eq("id", query.id)
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Discovery failed"
        await service.from("discovery_analytics").insert({
          job_id: job.id,
          query_id: query.id,
          event_type: "fail",
          details: { error: errorMessage },
        })
      }

      await service
        .from("discovery_jobs")
        .update({
          status: errorMessage ? "failed" : "completed",
          repos_found: found,
          repos_new: newRepos,
          repos_duplicated: duplicated,
          repos_failed: failed,
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id)

      results.push({
        query: query.name,
        found,
        new: newRepos,
        duplicated,
        failed,
        status: errorMessage ? "failed" : "completed",
      })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Discovery scheduler error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
