import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Token exchange configs per provider
const TOKEN_CONFIGS: Record<string, {
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
}> = {
  github: { tokenUrl: "https://github.com/login/oauth/access_token", clientIdEnv: "GITHUB_CLIENT_ID", clientSecretEnv: "GITHUB_CLIENT_SECRET" },
  google: { tokenUrl: "https://oauth2.googleapis.com/token", clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
  slack: { tokenUrl: "https://slack.com/api/oauth.v2.access", clientIdEnv: "SLACK_CLIENT_ID", clientSecretEnv: "SLACK_CLIENT_SECRET" },
  discord: { tokenUrl: "https://discord.com/api/oauth2/token", clientIdEnv: "DISCORD_CLIENT_ID", clientSecretEnv: "DISCORD_CLIENT_SECRET" },
  notion: { tokenUrl: "https://api.notion.com/v1/oauth/token", clientIdEnv: "NOTION_CLIENT_ID", clientSecretEnv: "NOTION_CLIENT_SECRET" },
  linear: { tokenUrl: "https://api.linear.app/oauth/token", clientIdEnv: "LINEAR_CLIENT_ID", clientSecretEnv: "LINEAR_CLIENT_SECRET" },
  twitter: { tokenUrl: "https://api.twitter.com/2/oauth2/token", clientIdEnv: "TWITTER_CLIENT_ID", clientSecretEnv: "TWITTER_CLIENT_SECRET" },
  linkedin: { tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken", clientIdEnv: "LINKEDIN_CLIENT_ID", clientSecretEnv: "LINKEDIN_CLIENT_SECRET" },
  stripe: { tokenUrl: "https://connect.stripe.com/oauth/token", clientIdEnv: "STRIPE_CLIENT_ID", clientSecretEnv: "STRIPE_CLIENT_SECRET" },
}

const SUCCESS_HTML = (provider: string, credentialId: string) => `<!DOCTYPE html>
<html>
<head><title>Connected!</title></head>
<body style="font-family:system-ui;background:#0a0a12;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="text-align:center">
    <div style="font-size:3rem;margin-bottom:1rem">✅</div>
    <h2 style="margin:0 0 0.5rem;font-weight:600">Connected to ${provider}!</h2>
    <p style="color:rgba(255,255,255,0.4);font-size:0.875rem">This window will close automatically</p>
  </div>
  <script>
    window.opener?.postMessage({ type: 'nexus_oauth_complete', provider: '${provider}', credentialId: '${credentialId}' }, '*');
    setTimeout(() => window.close(), 1500);
  </script>
</body>
</html>`

const ERROR_HTML = (msg: string) => `<!DOCTYPE html>
<html>
<head><title>Connection Error</title></head>
<body style="font-family:system-ui;background:#0a0a12;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="text-align:center">
    <div style="font-size:3rem;margin-bottom:1rem">❌</div>
    <h2 style="margin:0 0 0.5rem;color:#f87171">Connection Failed</h2>
    <p style="color:rgba(255,255,255,0.4);font-size:0.875rem;max-width:300px">${msg}</p>
    <button onclick="window.close()" style="margin-top:1.5rem;padding:0.5rem 1.5rem;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.875rem">Close</button>
  </div>
</body>
</html>`

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const stateRaw = url.searchParams.get("state")
  const errorParam = url.searchParams.get("error")

  const html = (content: string) => new NextResponse(content, { headers: { "Content-Type": "text/html" } })

  if (errorParam) return html(ERROR_HTML(`Authorization denied: ${errorParam}`))
  if (!code) return html(ERROR_HTML("No authorization code received"))

  let userId: string
  try {
    const state = JSON.parse(Buffer.from(stateRaw ?? "", "base64url").toString())
    userId = state.userId
  } catch {
    return html(ERROR_HTML("Invalid OAuth state parameter"))
  }

  const config = TOKEN_CONFIGS[provider]
  if (!config) return html(ERROR_HTML(`Unknown provider: ${provider}`))

  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]
  if (!clientId || !clientSecret) return html(ERROR_HTML(`Server misconfiguration: ${provider} credentials not set`))

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/nexus/oauth/${provider}/callback`

  try {
    // Exchange code for token
    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        // Basic auth for providers that need it
        ...(provider === "notion" ? { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` } : {}),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const tokenData = await tokenRes.json() as Record<string, unknown>
    if (tokenData.error) return html(ERROR_HTML(String(tokenData.error_description ?? tokenData.error)))

    // Store the token as a credential in nexus_credentials
    const supabase = await createClient()
    const value = JSON.stringify(tokenData)
    const { data, error } = await supabase
      .from("nexus_credentials")
      .insert({ user_id: userId, provider, name: provider, value })
      .select("id")
      .single()

    if (error) return html(ERROR_HTML(`Failed to save credential: ${error.message}`))
    return html(SUCCESS_HTML(provider, data.id))
  } catch (e) {
    return html(ERROR_HTML(e instanceof Error ? e.message : "Unexpected error during token exchange"))
  }
}
