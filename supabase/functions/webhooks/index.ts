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
      // Create a new webhook
      const { name, url, events = [], secret } = await req.json()

      if (!name || !url || !events.length) {
        return new Response(
          JSON.stringify({ error: 'Name, URL, and events are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate secure webhook secret if not provided
      const webhookSecret = secret || `whsec_${crypto.randomUUID()}`

      // Insert into database
      const { data: webhookData, error: insertError } = await supabaseClient
        .from('webhooks')
        .insert({
          user_id: user.id,
          name,
          url,
          secret: webhookSecret,
          events,
          status: 'ACTIVE',
        })
        .select()
        .single()

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create webhook', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the creation
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'WEBHOOK_CREATED',
          entity_type: 'webhook',
          entity_id: webhookData.id,
          metadata: { name, url, events },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify({
          id: webhookData.id,
          name: webhookData.name,
          url: webhookData.url,
          events: webhookData.events,
          status: webhookData.status,
          secret: webhookSecret, // Only returned once
          createdAt: webhookData.created_at,
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'GET') {
      // List webhooks for the user
      const { data: webhooks, error: fetchError } = await supabaseClient
        .from('webhooks')
        .select('id, name, url, events, status, total_deliveries, failed_deliveries, last_delivery_at, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch webhooks', details: fetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mask the secret in response
      const maskedWebhooks = webhooks.map(webhook => ({
        ...webhook,
        secret: "whsec_" + "•".repeat(16)
      }))

      return new Response(
        JSON.stringify({ webhooks: maskedWebhooks }),
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
    console.error('Webhooks function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
