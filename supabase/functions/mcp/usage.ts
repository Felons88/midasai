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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req

    if (method === 'POST') {
      const { serverId, userId, operation, duration, success, error, metadata } = await req.json()

      if (!serverId || !userId || !operation) {
        return new Response(
          JSON.stringify({ error: 'Server ID, user ID, and operation are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log MCP usage
      const { error: logError } = await supabaseClient
        .from('mcp_usage')
        .insert({
          mcp_server_id: serverId,
          user_id: userId,
          operation,
          duration_ms: duration || 0,
          success: success || true,
          error_message: error || null,
          metadata: metadata || {},
        })

      if (logError) {
        console.error('Failed to log MCP usage:', logError)
      }

      // Update server statistics
      const { error: updateError } = await supabaseClient.rpc('update_mcp_server_stats', {
        server_id: serverId,
        operation_success: success || true,
        operation_duration: duration || 0,
      })

      if (updateError) {
        console.error('Failed to update MCP server stats:', updateError)
      }

      return new Response(
        JSON.stringify({ success: true }),
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
    console.error('MCP usage function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
