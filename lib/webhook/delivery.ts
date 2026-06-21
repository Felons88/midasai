import { createClient } from '@/lib/supabase/server'

interface WebhookDeliveryResult {
  success: boolean
  statusCode?: number
  error?: string
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000] // 1s, 5s, 15s

export async function deliverWebhook(
  webhookId: string,
  payload: any
): Promise<WebhookDeliveryResult> {
  const supabase = await createClient()
  
  try {
    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single()
    
    if (webhookError || !webhook) {
      return { success: false, error: 'Webhook not found' }
    }
    
    if (!webhook.is_active) {
      return { success: false, error: 'Webhook is inactive' }
    }
    
    // Attempt delivery with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const result = await attemptDelivery(webhook, payload)
      
      if (result.success) {
        // Log successful delivery
        await logDelivery(webhookId, payload, result, attempt)
        return result
      }
      
      // If this wasn't the last attempt, wait before retry
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAYS[attempt])
      }
    }
    
    // All retries failed - move to dead letter queue
    await moveToDeadLetterQueue(webhookId, payload)
    await logDelivery(webhookId, payload, { success: false, error: 'Max retries exceeded' }, MAX_RETRIES)
    
    return { success: false, error: 'Max retries exceeded' }
  } catch (error) {
    console.error('Webhook delivery error:', error)
    return { success: false, error: 'Internal error' }
  }
}

async function attemptDelivery(
  webhook: any,
  payload: any
): Promise<WebhookDeliveryResult> {
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': await generateSignature(webhook.secret, payload),
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Timestamp': Date.now().toString(),
      },
      body: JSON.stringify(payload),
    })
    
    if (response.ok) {
      return { success: true, statusCode: response.status }
    }
    
    return { 
      success: false, 
      statusCode: response.status,
      error: `HTTP ${response.status}` 
    }
  } catch (error) {
    return { success: false, error: 'Network error' }
  }
}

async function generateSignature(secret: string, payload: any): Promise<string> {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('hex')
}

async function logDelivery(
  webhookId: string,
  payload: any,
  result: WebhookDeliveryResult,
  attempt: number
): Promise<void> {
  const supabase = await createClient()
  
  await supabase.from('webhook_deliveries').insert({
    webhook_id: webhookId,
    payload,
    success: result.success,
    status_code: result.statusCode,
    error: result.error,
    attempt,
    delivered_at: new Date().toISOString(),
  })
}

async function moveToDeadLetterQueue(
  webhookId: string,
  payload: any
): Promise<void> {
  const supabase = await createClient()
  
  await supabase.from('webhook_dead_letter_queue').insert({
    webhook_id: webhookId,
    payload,
    failed_at: new Date().toISOString(),
    reason: 'Max retries exceeded',
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retryDeadLetterWebhooks(): Promise<void> {
  const supabase = await createClient()
  
  // Get webhooks from dead letter queue
  const { data: deadWebhooks } = await supabase
    .from('webhook_dead_letter_queue')
    .select('*')
    .limit(10)
  
  if (!deadWebhooks || deadWebhooks.length === 0) {
    return
  }
  
  for (const deadWebhook of deadWebhooks) {
    const result = await deliverWebhook(deadWebhook.webhook_id, deadWebhook.payload)
    
    if (result.success) {
      // Remove from dead letter queue
      await supabase
        .from('webhook_dead_letter_queue')
        .delete()
        .eq('id', deadWebhook.id)
    }
  }
}
