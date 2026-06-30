import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

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

    const { method } = req

    if (method === 'POST') {
      const { name, description, endpoint, version, capabilities, config } = await req.json()

      if (!name || !endpoint) {
        return new Response(
          JSON.stringify({ error: 'Name and endpoint are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate MCP server token
      const serverToken = `mcp_${crypto.randomUUID()}`

      const { data: server, error: insertError } = await supabaseClient
        .from('mcp_servers')
        .insert({
          user_id: user.id,
          name,
          description,
          endpoint,
          version: version || '1.0.0',
          capabilities: capabilities || [],
          config: config || {},
          status: 'ACTIVE',
        })
        .select()
        .single()

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create MCP server', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create MCP token for this server
      const { error: tokenError } = await supabaseClient
        .from('mcp_tokens')
        .insert({
          mcp_server_id: server.id,
          user_id: user.id,
          token: serverToken,
          permissions: ['read', 'write', 'execute'],
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        })

      if (tokenError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create MCP token', details: tokenError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'MCP_SERVER_CREATED',
          entity_type: 'mcp_server',
          entity_id: server.id,
          metadata: { name, endpoint },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify({
          id: server.id,
          name: server.name,
          endpoint: server.endpoint,
          version: server.version,
          status: server.status,
          token: serverToken, // Only returned once
          capabilities: server.capabilities,
          createdAt: server.created_at,
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'GET') {
      const { data: servers, error: fetchError } = await supabaseClient
        .from('mcp_servers')
        .select('id, name, description, endpoint, version, status, capabilities, total_requests, avg_latency_ms, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch MCP servers', details: fetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ servers }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('MCP function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
