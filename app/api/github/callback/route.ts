import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user_id passed from auth.ts
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${appUrl}/creator/upload?github_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/creator/upload?github_error=missing_params`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData.error_description)
      return NextResponse.redirect(`${appUrl}/creator/upload?github_error=${encodeURIComponent(tokenData.error_description)}`)
    }

    // Fetch GitHub user profile
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!githubUserResponse.ok) {
      return NextResponse.redirect(`${appUrl}/creator/upload?github_error=github_user_fetch_failed`)
    }

    const githubUser = await githubUserResponse.json()

    // Store connection using service role (bypasses RLS since state=userId is trusted)
    const supabase = createServiceClient()

    const { error: upsertError } = await supabase
      .from('github_connections')
      .upsert({
        user_id: state,
        github_user_id: githubUser.id.toString(),
        github_username: githubUser.login,
        github_access_token: tokenData.access_token,
        github_refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        avatar_url: githubUser.avatar_url,
        name: githubUser.name,
        email: githubUser.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (upsertError) {
      console.error('Error storing GitHub connection:', upsertError)
      return NextResponse.redirect(`${appUrl}/creator/upload?github_error=db_error`)
    }

    return NextResponse.redirect(`${appUrl}/creator/upload?github_connected=true`)
  } catch (err) {
    console.error('GitHub callback error:', err)
    return NextResponse.redirect(`${appUrl}/creator/upload?github_error=server_error`)
  }
}
