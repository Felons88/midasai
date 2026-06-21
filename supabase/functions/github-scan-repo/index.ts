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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { repoFullName } = await req.json()
    if (!repoFullName) {
      return new Response(JSON.stringify({ error: 'repoFullName is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: connection } = await supabase
      .from('github_connections')
      .select('github_access_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!connection?.github_access_token) {
      return new Response(JSON.stringify({ error: 'GitHub not connected' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${connection.github_access_token}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!repoRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch repository' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const repoData = await repoRes.json()

    return new Response(JSON.stringify({ repository: repoData }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('GitHub scan-repo error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
