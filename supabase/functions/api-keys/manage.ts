import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get the authenticated user
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

    const url = new URL(req.url)
    const keyId = url.pathname.split('/').pop()
    const { method } = req

    if (!keyId) {
      return new Response(
        JSON.stringify({ error: 'API key ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the API key belongs to the user
    const { data: existingKey, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single()

    if (keyError || !existingKey) {
      return new Response(
        JSON.stringify({ error: 'API key not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE') {
      // Revoke API key
      const { error: updateError } = await supabaseClient
        .from('api_keys')
        .update({ 
          status: 'REVOKED',
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .eq('user_id', user.id)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to revoke API key', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the revocation
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'API_KEY_REVOKED',
          entity_type: 'api_key',
          entity_id: keyId,
          metadata: { name: existingKey.name },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify({ message: 'API key revoked successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'PATCH') {
      // Update API key
      const { name, permissions, rateLimit, status } = await req.json()

      const updateData: any = { updated_at: new Date().toISOString() }
      
      if (name !== undefined) updateData.name = name
      if (permissions !== undefined) updateData.permissions = permissions
      if (rateLimit !== undefined) updateData.rate_limit = rateLimit
      if (status !== undefined) updateData.status = status

      const { data: updatedKey, error: updateError } = await supabaseClient
        .from('api_keys')
        .update(updateData)
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update API key', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the update
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'API_KEY_UPDATED',
          entity_type: 'api_key',
          entity_id: keyId,
          metadata: { changes: updateData },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify(updatedKey),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'GET') {
      // Get specific API key details (without the actual key value)
      const { data: apiKey, error: fetchError } = await supabaseClient
        .from('api_keys')
        .select('id, name, key_prefix, status, permissions, rate_limit, expires_at, last_used_at, created_at, updated_at')
        .eq('id', keyId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch API key', details: fetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(apiKey),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('API Keys manage function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
