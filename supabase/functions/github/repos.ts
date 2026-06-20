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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get GitHub connection for user
    const { data: githubConnection, error: connectionError } = await supabaseClient
      .from('github_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !githubConnection) {
      return new Response(
        JSON.stringify({ error: 'GitHub connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is expired and refresh if needed
    let accessToken = githubConnection.github_access_token
    if (githubConnection.token_expires_at && new Date(githubConnection.token_expires_at) < new Date()) {
      // Refresh token logic would go here
      // For now, we'll use the existing token
    }

    // Fetch user's repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?type=owner&sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!reposResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch repositories' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const repos = await reposResponse.json()

    // Format repositories for frontend
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
      default_branch: repo.default_branch,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      topics: repo.topics || [],
      license: repo.license ? repo.license.name : null,
      size: repo.size,
    }))

    return new Response(
      JSON.stringify({ repositories: formattedRepos }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('GitHub repos function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
