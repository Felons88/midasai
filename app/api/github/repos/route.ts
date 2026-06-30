import { createClient } from "@/lib/supabase/server"
import { githubFetch, requireGitHubConnection } from "@/lib/github/connection"
import { NextResponse } from "next/server"

type GitHubRepoApi = {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  html_url: string
  topics?: string[]
  license?: { name: string } | null
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const connection = await requireGitHubConnection(user.id)
  if (!connection) {
    return NextResponse.json({ error: "GitHub connection not found" }, { status: 404 })
  }

  const repos = await githubFetch<GitHubRepoApi[]>(
    connection.github_access_token,
    "/user/repos?type=owner&sort=updated&per_page=100"
  )

  const repositories = repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    private: repo.private,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at,
    html_url: repo.html_url,
    topics: repo.topics ?? [],
    license: repo.license?.name ?? null,
  }))

  return NextResponse.json({ repositories })
}
