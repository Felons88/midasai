import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GITHUB_CLIENT_ID')!,
        client_secret: Deno.env.get('GITHUB_CLIENT_SECRET')!,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: tokenData.error_description }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'MidasAI-Platform',
      },
    })

    const githubUser = await userResponse.json()

    // Store GitHub connection in database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from state or JWT
    let userId = state
    if (!userId && req.headers.get('Authorization')) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        req.headers.get('Authorization')!.replace('Bearer ', '')
      )
      userId = user?.id
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store GitHub connection
    const { error: insertError } = await supabaseClient
      .from('github_connections')
      .upsert({
        user_id: userId,
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
      })

    if (insertError) {
      console.error('Error storing GitHub connection:', insertError)
    }

    // Redirect back to upload page with success
    const redirectUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/creator/upload?github_connected=true`
    
    return new Response('', {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    })
  } catch (error) {
    console.error('GitHub callback function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
