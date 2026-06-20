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
      const { name, description, website, callbackUrl, webhookUrl, homepageUrl, logoUrl } = await req.json()

      if (!name || !website || !callbackUrl) {
        return new Response(
          JSON.stringify({ error: 'Name, website, and callback URL are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate OAuth client credentials
      const clientId = `midas_${crypto.randomUUID()}`
      const clientSecret = crypto.randomUUID()

      const { data: app, error: insertError } = await supabaseClient
        .from('applications')
        .insert({
          user_id: user.id,
          name,
          description,
          website,
          callback_url: callbackUrl,
          webhook_url: webhookUrl,
          homepage_url: homepageUrl,
          logo_url: logoUrl,
          client_id: clientId,
          client_secret: clientSecret,
          status: 'ACTIVE',
        })
        .select()
        .single()

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create application', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'APPLICATION_CREATED',
          entity_type: 'application',
          entity_id: app.id,
          metadata: { name, website },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        })

      return new Response(
        JSON.stringify({
          id: app.id,
          name: app.name,
          clientId,
          clientSecret, // Only returned once
          status: app.status,
          createdAt: app.created_at,
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (method === 'GET') {
      const { data: apps, error: fetchError } = await supabaseClient
        .from('applications')
        .select('id, name, description, website, callback_url, webhook_url, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch applications', details: fetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ applications: apps }),
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
    console.error('Applications function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
