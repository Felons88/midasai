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
      const { apiKey, endpoint, method: httpMethod, statusCode, latencyMs, userAgent, ipAddress } = await req.json()

      if (!apiKey || !endpoint || !httpMethod || !statusCode) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find the API key and get user_id
      const { data: keyData, error: keyError } = await supabaseClient
        .from('api_keys')
        .select('user_id')
        .eq('key_hash', apiKey)
        .eq('status', 'ACTIVE')
        .single()

      if (keyError || !keyData) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the API usage
      const { error: logError } = await supabaseClient
        .from('api_usage')
        .insert({
          user_id: keyData.user_id,
          api_key_id: null, // Will be updated when we have the key ID
          endpoint,
          method: httpMethod,
          status_code: statusCode,
          latency_ms: latencyMs,
          user_agent: userAgent,
          ip_address: ipAddress,
        })

      if (logError) {
        console.error('Failed to log API usage:', logError)
        // Don't fail the request, just log the error
      }

      // Update last_used_at for the API key
      await supabaseClient
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', apiKey)

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
    console.error('Usage tracking error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
