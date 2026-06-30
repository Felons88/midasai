import { createClient } from '@/lib/supabase/server'

interface RateLimitAlert {
  identifier: string
  type: string
  threshold: number
  current: number
  timestamp: number
}

const ALERT_THRESHOLDS = {
  warning: 0.8, // 80% of limit
  critical: 0.95, // 95% of limit
}

export async function checkRateLimitAlerts(
  identifier: string,
  type: string,
  currentUsage: number,
  limit: number
): Promise<void> {
  const usageRatio = currentUsage / limit
  
  // Check if we should send an alert
  if (usageRatio >= ALERT_THRESHOLDS.critical) {
    await sendAlert(identifier, type, 'critical', currentUsage, limit)
  } else if (usageRatio >= ALERT_THRESHOLDS.warning) {
    await sendAlert(identifier, type, 'warning', currentUsage, limit)
  }
}

async function sendAlert(
  identifier: string,
  type: string,
  severity: 'warning' | 'critical',
  currentUsage: number,
  limit: number
): Promise<void> {
  const supabase = await createClient()
  
  try {
    // Log alert to database
    await supabase.from('rate_limit_alerts').insert({
      identifier,
      type,
      severity,
      current_usage: currentUsage,
      rate_limit: limit,
      created_at: new Date().toISOString(),
    })
    
    // In production, you could also send:
    // - Email alerts
    // - Slack/webhook notifications
    // - PagerDuty alerts for critical issues
    // - CloudWatch/DataDog metrics
    
    console.warn(`Rate limit alert: ${severity} - ${identifier} (${type}) - ${currentUsage}/${limit}`)
  } catch (error) {
    console.error('Failed to send rate limit alert:', error)
  }
}

export async function cleanupOldAlerts(): Promise<void> {
  const supabase = await createClient()
  
  // Delete alerts older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  
  await supabase
    .from('rate_limit_alerts')
    .delete()
    .lt('created_at', sevenDaysAgo)
}
