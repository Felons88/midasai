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

    const { method } = req

    if (method === 'POST') {
      const { serverId, config = {} } = await req.json()

      if (!serverId) {
        return new Response(
          JSON.stringify({ error: 'Server ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify server ownership
      const { data: server, error: serverError } = await supabaseClient
        .from('mcp_servers')
        .select('*')
        .eq('id', serverId)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single()

      if (serverError || !server) {
        return new Response(
          JSON.stringify({ error: 'MCP server not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Test connection to MCP server
      const connectionTest = await testMCPConnection(server.endpoint, config)

      if (!connectionTest.success) {
        return new Response(
          JSON.stringify({ error: 'Failed to connect to MCP server', details: connectionTest.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create connection record
      const { data: connection, error: connectionError } = await supabaseClient
        .from('mcp_connections')
        .insert({
          mcp_server_id: serverId,
          user_id: user.id,
          connection_config: config,
          status: 'CONNECTED',
          capabilities: connectionTest.capabilities || [],
        })
        .select()
        .single()

      if (connectionError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create connection', details: connectionError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'MCP_CONNECTION_CREATED',
          entity_type: 'mcp_connection',
          entity_id: connection.id,
          metadata: { server_id: serverId, server_name: server.name },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify({
          id: connection.id,
          serverId: serverId,
          status: 'CONNECTED',
          capabilities: connection.capabilities,
          connectedAt: connection.created_at,
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'GET') {
      const { data: connections, error: fetchError } = await supabaseClient
        .from('mcp_connections')
        .select(`
          id,
          mcp_server_id,
          status,
          capabilities,
          connection_config,
          created_at,
          updated_at,
          mcp_servers (
            id,
            name,
            endpoint,
            version
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch connections', details: fetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ connections }),
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
    console.error('MCP connect function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testMCPConnection(endpoint: string, config: any): Promise<{ success: boolean; error?: string; capabilities?: any[] }> {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MidasAI-MCP-Client/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()
    return { 
      success: true, 
      capabilities: data.capabilities || [] 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    }
  }
}
