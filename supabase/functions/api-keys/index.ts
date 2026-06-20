import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

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

    const { method } = req

    if (method === 'POST') {
      // Create a new API key
      const { name, permissions = [], rateLimit = 1000, expiresAt } = await req.json()

      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Name is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate secure API key
      const keyId = crypto.randomUUID()
      const keySecret = crypto.randomUUID()
      const apiKey = `midas_${keyId}_${keySecret}`
      
      // Generate hash for storage
      const encoder = new TextEncoder()
      const keyData = encoder.encode(apiKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Create prefix for display
      const keyPrefix = `midas_${keyId.substring(0, 8)}`

      // Insert into database
      const { data: apiKeyData, error: insertError } = await supabaseClient
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          key_value: apiKey, // Store temporarily, will be cleared after first response
          status: 'ACTIVE',
          permissions,
          rate_limit: rateLimit,
          expires_at: expiresAt || null,
        })
        .select()
        .single()

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create API key', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the creation
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'API_KEY_CREATED',
          entity_type: 'api_key',
          entity_id: apiKeyData.id,
          metadata: { name, permissions, rate_limit },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify({
          id: apiKeyData.id,
          name: apiKeyData.name,
          apiKey: apiKey, // Only returned once
          prefix: keyPrefix,
          permissions: apiKeyData.permissions,
          rateLimit: apiKeyData.rate_limit,
          expiresAt: apiKeyData.expires_at,
          createdAt: apiKeyData.created_at,
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'GET') {
      // List API keys for the user
      const { data: apiKeys, error: fetchError } = await supabaseClient
        .from('api_keys')
        .select('id, name, key_prefix, status, permissions, rate_limit, expires_at, last_used_at, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch API keys', details: fetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ apiKeys }),
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
    console.error('API Keys function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
