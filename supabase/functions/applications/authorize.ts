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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const { method } = req

    if (method === 'GET') {
      // OAuth Authorization Endpoint
      const clientId = url.searchParams.get('client_id')
      const redirectUri = url.searchParams.get('redirect_uri')
      const scope = url.searchParams.get('scope')
      const state = url.searchParams.get('state')
      const responseType = url.searchParams.get('response_type')

      if (!clientId || !redirectUri || !responseType || responseType !== 'code') {
        return new Response(
          JSON.stringify({ error: 'invalid_request' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate client
      const { data: app, error: appError } = await supabaseClient
        .from('applications')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'ACTIVE')
        .single()

      if (appError || !app) {
        return new Response(
          JSON.stringify({ error: 'invalid_client' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate authorization code and state
      const authCode = crypto.randomUUID()
      const authState = state || crypto.randomUUID()

      // Store authorization request
      const { error: storeError } = await supabaseClient
        .from('oauth_authorization_codes')
        .insert({
          application_id: app.id,
          code: authCode,
          redirect_uri: redirectUri,
          scope: scope || 'read',
          state: authState,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        })

      if (storeError) {
        return new Response(
          JSON.stringify({ error: 'server_error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Redirect to consent page
      const consentUrl = `/oauth/consent?client_id=${clientId}&code=${authCode}&state=${authState}&redirect_uri=${encodeURIComponent(redirectUri)}`
      
      return new Response('', {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': consentUrl,
        },
      })
    } else if (method === 'POST') {
      // Token Exchange Endpoint
      const { grant_type, client_id, client_secret, code, redirect_uri, code_verifier } = await req.json()

      if (grant_type !== 'authorization_code' || !client_id || !client_secret || !code) {
        return new Response(
          JSON.stringify({ error: 'invalid_request' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate client credentials
      const { data: app, error: appError } = await supabaseClient
        .from('applications')
        .select('*')
        .eq('client_id', client_id)
        .eq('client_secret', client_secret)
        .eq('status', 'ACTIVE')
        .single()

      if (appError || !app) {
        return new Response(
          JSON.stringify({ error: 'invalid_client' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate authorization code
      const { data: authCode, error: codeError } = await supabaseClient
        .from('oauth_authorization_codes')
        .select('*')
        .eq('code', code)
        .eq('application_id', app.id)
        .eq('redirect_uri', redirect_uri)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (codeError || !authCode) {
        return new Response(
          JSON.stringify({ error: 'invalid_grant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate access token
      const accessToken = crypto.randomUUID()
      const refreshToken = crypto.randomUUID()

      // Store tokens
      const { error: tokenError } = await supabaseClient
        .from('oauth_tokens')
        .insert({
          application_id: app.id,
          user_id: authCode.user_id,
          access_token: accessToken,
          refresh_token: refreshToken,
          scope: authCode.scope,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
        })

      if (tokenError) {
        return new Response(
          JSON.stringify({ error: 'server_error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Delete used authorization code
      await supabaseClient
        .from('oauth_authorization_codes')
        .delete()
        .eq('code', code)

      return new Response(
        JSON.stringify({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: refreshToken,
          scope: authCode.scope,
        }),
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
    console.error('OAuth authorize function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
