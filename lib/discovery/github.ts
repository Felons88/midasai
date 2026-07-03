import type { SupabaseClient } from "@supabase/supabase-js"

const GITHUB_API = "https://api.github.com"
const USER_AGENT = "MidasAI-Discovery/1.0"

export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string
  language: string | null
  topics: string[]
  license: { name: string; spdx_id: string | null } | null
  fork: boolean
  owner: {
    login: string
    html_url: string
    avatar_url: string
  }
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  pushed_at: string | null
  created_at: string | null
  updated_at: string | null
  size: number
  homepage: string | null
  has_readme?: boolean
}

export type DiscoveryQuery = {
  id: string
  name: string
  query: string
  sort: string
  order: string
  language?: string | null
  topics?: string[] | null
  min_stars: number
}

export type DiscoveryRunResult = {
  jobId: string
  found: number
  new: number
  duplicated: number
  failed: number
  repos: GitHubRepo[]
}

const MAX_RETRIES = 3
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error("GITHUB_TOKEN environment variable is not set")
  return token
}

function retryDelayMs(res: Response, attempt: number): number {
  const header = res.headers.get("Retry-After")
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000
  }
  if (res.status === 429 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = res.headers.get("x-ratelimit-reset")
    if (reset) {
      const resetMs = Number(reset) * 1000
      const delay = resetMs - Date.now()
      if (delay > 0) return Math.min(delay + 1000, 60_000)
    }
  }
  return Math.min(2_000 * 2 ** attempt, 30_000)
}

async function githubApiFetch<T>(path: string, init?: RequestInit, attempt = 0): Promise<{ data: T; headers: Headers }> {
  const token = getGitHubToken()
  const url = `${GITHUB_API}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github.v3+json",
      ...(init?.headers ?? {}),
    },
  })

  if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, retryDelayMs(res, attempt)))
    return githubApiFetch(path, init, attempt + 1)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 160)}` : ""}`)
  }

  const data = (await res.json()) as T
  return { data, headers: res.headers }
}

export function buildSearchPath(query: DiscoveryQuery): string {
  const q = new URLSearchParams()
  let queryString = query.query
  if (query.language) queryString += ` language:${query.language}`
  if (query.topics?.length) {
    for (const topic of query.topics) queryString += ` topic:${topic}`
  }
  q.set("q", queryString)
  q.set("sort", query.sort || "stars")
  q.set("order", query.order || "desc")
  q.set("per_page", "100")
  return `/search/repositories?${q.toString()}`
}

export async function searchGitHubRepositories(query: DiscoveryQuery): Promise<{ repos: GitHubRepo[]; headers: Headers }> {
  const path = buildSearchPath(query)
  const { data, headers } = await githubApiFetch<{ items: GitHubRepo[] }>(path)
  return { repos: data.items ?? [], headers }
}

export async function fetchGitHubReadme(owner: string, repo: string, branch?: string): Promise<string> {
  try {
    const { data } = await githubApiFetch<{ content?: string; encoding?: string }>(
      `/repos/${owner}/${repo}/readme`
    )
    if (!data.content || data.encoding !== "base64") return ""
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 20_000)
  } catch (err) {
    return ""
  }
}

export async function fetchGitHubRepoTags(owner: string, repo: string): Promise<string[]> {
  try {
    const { data } = await githubApiFetch<{ name: string }[]>(
      `/repos/${owner}/${repo}/tags?per_page=10`
    )
    return data.map((t) => t.name)
  } catch {
    return []
  }
}

export async function fetchGitHubReleases(owner: string, repo: string): Promise<{ tag_name: string; name: string; published_at: string | null }[]> {
  try {
    const { data } = await githubApiFetch<{ tag_name: string; name: string; published_at: string | null }[]>(
      `/repos/${owner}/${repo}/releases?per_page=10`
    )
    return data
  } catch {
    return []
  }
}

export async function runDiscoveryJob(
  service: SupabaseClient,
  jobId: string,
  query: DiscoveryQuery
): Promise<DiscoveryRunResult> {
  const result: DiscoveryRunResult = {
    jobId,
    found: 0,
    new: 0,
    duplicated: 0,
    failed: 0,
    repos: [],
  }

  let repos: GitHubRepo[] = []
  try {
    const search = await searchGitHubRepositories(query)
    repos = search.repos.filter((r) => !r.fork && r.stargazers_count >= query.min_stars)
    result.found = repos.length
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed"
    await service.from("discovery_jobs").update({ status: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", jobId)
    await service.from("discovery_analytics").insert({ job_id: jobId, event_type: "fail", details: { phase: "search", error: message } })
    throw err
  }

  await service.from("discovery_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", jobId)

  for (const repo of repos) {
    try {
      const existing = await service
        .from("discovered_repositories")
        .select("id")
        .eq("github_id", repo.id)
        .maybeSingle()

      const readme = await fetchGitHubReadme(repo.owner.login, repo.name, repo.default_branch)
      const tags = await fetchGitHubRepoTags(repo.owner.login, repo.name)
      const releases = await fetchGitHubReleases(repo.owner.login, repo.name)

      const repoData = {
        github_id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description ?? "",
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        primary_language: repo.language ?? null,
        topics: repo.topics ?? [],
        license: repo.license?.name ?? null,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        watchers_count: repo.watchers_count,
        open_issues_count: repo.open_issues_count,
        pushed_at: repo.pushed_at,
        created_at: repo.created_at,
        repo_size_kb: repo.size,
        has_readme: readme.length > 0,
        homepage: repo.homepage ?? null,
        owner_avatar_url: repo.owner.avatar_url,
        owner_html_url: repo.owner.html_url,
        metadata: {
          readme_length: readme.length,
          tags,
          releases,
        } as Record<string, unknown>,
        last_seen_at: new Date().toISOString(),
        status: "new" as const,
      }

      if (existing?.data?.id) {
        await service.from("discovered_repositories").update(repoData).eq("id", existing.data.id)
        result.duplicated += 1
        await service.from("discovery_analytics").insert({ job_id: jobId, query_id: query.id, event_type: "duplicate", details: { repo_id: repo.id, full_name: repo.full_name } })
      } else {
        const { data: inserted } = await service
          .from("discovered_repositories")
          .insert({ ...repoData, first_seen_at: new Date().toISOString() })
          .select("id")
          .single()
        result.new += 1
        if (inserted?.id) {
          await service.from("import_queue").insert({ repository_id: inserted.id, status: "pending" })
        }
        await service.from("discovery_analytics").insert({ job_id: jobId, query_id: query.id, event_type: "success", details: { repo_id: repo.id, full_name: repo.full_name } })
      }

      result.repos.push({ ...repo, has_readme: readme.length > 0 })
    } catch (err) {
      result.failed += 1
      const message = err instanceof Error ? err.message : "Unknown error"
      await service.from("discovery_analytics").insert({ job_id: jobId, query_id: query.id, event_type: "fail", details: { repo_id: repo.id, full_name: repo.full_name, error: message } })
    }
  }

  await service.from("discovery_jobs").update({
    status: "completed",
    repos_found: result.found,
    repos_new: result.new,
    repos_duplicated: result.duplicated,
    repos_failed: result.failed,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId)

  await service.from("discovery_queries").update({ last_run_at: new Date().toISOString() }).eq("id", query.id)

  return result
}
