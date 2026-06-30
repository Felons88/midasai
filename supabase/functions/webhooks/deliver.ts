import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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

    const { method } = req

    if (method === 'POST') {
      const { webhookId, event, payload } = await req.json()

      if (!webhookId || !event || !payload) {
        return new Response(
          JSON.stringify({ error: 'webhookId, event, and payload are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get webhook details
      const { data: webhook, error: webhookError } = await supabaseClient
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single()

      if (webhookError || !webhook) {
        return new Response(
          JSON.stringify({ error: 'Webhook not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if event is subscribed
      if (!webhook.events.includes(event)) {
        return new Response(
          JSON.stringify({ error: 'Event not subscribed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create webhook delivery record
      const { data: delivery, error: deliveryError } = await supabaseClient
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhookId,
          event,
          payload,
          status: 'PENDING',
          attempts: 0,
        })
        .select()
        .single()

      if (deliveryError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create delivery record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Attempt delivery
      const payloadStr = JSON.stringify(payload)
      const signature = await signPayload(webhook.secret, payloadStr)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MidasAI-Webhooks/1.0',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event,
        },
        body: payloadStr,
      })

      const success = response.ok
      const responseText = await response.text()

      // Update delivery record
      await supabaseClient
        .from('webhook_deliveries')
        .update({
          status: success ? 'DELIVERED' : 'FAILED',
          response_code: response.status,
          response_body: responseText,
          attempts: 1,
          delivered_at: success ? new Date().toISOString() : null,
          next_retry_at: !success ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
        })
        .eq('id', delivery.id)

      // Update webhook stats
      await supabaseClient.rpc('update_webhook_stats', {
        webhook_id: webhookId,
        delivery_success: success,
      })

      return new Response(
        JSON.stringify({
          deliveryId: delivery.id,
          status: success ? 'DELIVERED' : 'FAILED',
          statusCode: response.status,
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
    console.error('Webhook delivery error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
