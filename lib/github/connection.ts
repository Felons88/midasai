import { createClient } from "@/lib/supabase/server"

export type GitHubConnection = {
  user_id: string
  github_username: string
  github_access_token: string
  token_expires_at: string | null
}

export function getGitHubAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  )
}

export async function requireGitHubConnection(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("github_connections")
    .select("user_id, github_username, github_access_token, token_expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as GitHubConnection
}

export async function githubFetch<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "MidasAI-Platform",
      Accept: "application/vnd.github.v3+json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }

  return res.json() as Promise<T>
}
