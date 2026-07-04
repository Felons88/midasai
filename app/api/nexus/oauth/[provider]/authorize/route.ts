import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OAUTH_CONFIGS: Record<string, {
  authUrl: string
  clientIdEnv: string
  scope: string
  extraParams?: Record<string, string>
}> = {
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    clientIdEnv: "GITHUB_CLIENT_ID",
    scope: "repo read:user workflow",
  },
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file email profile",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    clientIdEnv: "SLACK_CLIENT_ID",
    scope: "chat:write channels:read users:read",
  },
  discord: {
    authUrl: "https://discord.com/api/oauth2/authorize",
    clientIdEnv: "DISCORD_CLIENT_ID",
    scope: "bot applications.commands",
    extraParams: { permissions: "8" },
  },
  notion: {
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    clientIdEnv: "NOTION_CLIENT_ID",
    scope: "read_content update_content insert_content",
    extraParams: { response_type: "code", owner: "user" },
  },
  linear: {
    authUrl: "https://linear.app/oauth/authorize",
    clientIdEnv: "LINEAR_CLIENT_ID",
    scope: "read write",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    clientIdEnv: "TWITTER_CLIENT_ID",
    scope: "tweet.read tweet.write users.read offline.access",
    extraParams: { code_challenge_method: "plain", code_challenge: "challenge" },
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    scope: "r_liteprofile r_emailaddress w_member_social",
  },
  stripe: {
    authUrl: "https://connect.stripe.com/oauth/authorize",
    clientIdEnv: "STRIPE_CLIENT_ID",
    scope: "read_write",
    extraParams: { response_type: "code" },
  },
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  const config = OAUTH_CONFIGS[provider]
  if (!config) {
    return new NextResponse(`Unsupported OAuth provider: ${provider}`, { status: 400 })
  }

  const clientId = process.env[config.clientIdEnv]
  if (!clientId) {
    return new NextResponse(
      `<html><body style="font-family:monospace;background:#0a0a12;color:#fff;padding:2rem">
        <h2>⚠ OAuth not configured</h2>
        <p>Set <code>${config.clientIdEnv}</code> in your environment variables to enable ${provider} OAuth.</p>
        <p>You can still use a manual API key instead.</p>
        <script>setTimeout(() => window.close(), 5000)</script>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    )
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/nexus/oauth/${provider}/callback`
  const state = Buffer.from(JSON.stringify({ userId: user.id, provider })).toString("base64url")

  const url = new URL(config.authUrl)
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", config.scope)
  url.searchParams.set("state", state)
  if (!config.extraParams?.response_type) url.searchParams.set("response_type", "code")
  for (const [k, v] of Object.entries(config.extraParams ?? {})) {
    url.searchParams.set(k, v)
  }

  return NextResponse.redirect(url.toString())
}
