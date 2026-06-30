import { createClient } from "@/lib/supabase/server"
import { getGitHubAppUrl } from "@/lib/github/connection"
import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appUrl = getGitHubAppUrl()
  const redirectUri = `${appUrl}/api/github/callback`
  const scope = "repo user:email"
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${user.id}`

  return NextResponse.json({ authUrl, callbackUrl: redirectUri })
}
