import { createClient } from '@/lib/supabase/server'
import { getBillingContext, type BillingContext } from '@/lib/billing/entitlements'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix seconds
}

export interface RateLimitConfig {
  limit: number
  window: number // in seconds
}

export const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  api: { limit: 100, window: 60 }, // 100 requests per minute
  auth: { limit: 10, window: 60 }, // 10 auth requests per minute
  upload: { limit: 5, window: 60 }, // 5 uploads per minute
  webhook: { limit: 50, window: 60 }, // 50 webhook deliveries per minute
}

// Plan-based rate limit multipliers
const PLAN_MULTIPLIERS: Record<string, number> = {
  FREE: 1,
  PRO: 2,
  TEAM: 5,
  ENTERPRISE: 10,
}

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof DEFAULT_LIMITS = 'api',
  userId?: string
): Promise<RateLimitResult> {
  const baseConfig = DEFAULT_LIMITS[type]
  let limit = baseConfig.limit

  // Apply plan-based multiplier if user ID provided
  if (userId) {
    try {
      const supabase = await createClient()
      const billing = await getBillingContext(supabase, userId)
      const multiplier = PLAN_MULTIPLIERS[billing.limits.tier] || 1
      limit = Math.floor(baseConfig.limit * multiplier)
    } catch (error) {
      console.error('Error getting billing context for rate limit:', error)
      // Fall back to default limit
    }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .rpc('check_rate_limit_bucket', {
        p_key: `${type}:${identifier}`,
        p_limit: limit,
        p_window_seconds: baseConfig.window,
      })

    if (error || !data || data.length === 0) {
      console.error('Rate limit check error:', error)
      return failOpen(limit, baseConfig.window)
    }

    const row = data[0]
    return {
      success: row.allowed,
      limit: row.limit_value,
      remaining: row.remaining,
      reset: Math.floor(new Date(row.reset_at).getTime() / 1000),
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return failOpen(limit, baseConfig.window)
  }
}

export async function getRateLimitForUser(
  userId: string,
  type: keyof typeof DEFAULT_LIMITS = 'api'
): Promise<RateLimitConfig> {
  const baseConfig = DEFAULT_LIMITS[type]
  
  try {
    const supabase = await createClient()
    const billing = await getBillingContext(supabase, userId)
    const multiplier = PLAN_MULTIPLIERS[billing.limits.tier] || 1
    
    return {
      limit: Math.floor(baseConfig.limit * multiplier),
      window: baseConfig.window,
    }
  } catch (error) {
    console.error('Error getting billing context for rate limit:', error)
    return baseConfig
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

function failOpen(limit: number, window: number): RateLimitResult {
  const now = Math.floor(Date.now() / 1000)
  return {
    success: true,
    limit,
    remaining: limit,
    reset: now + window,
  }
}
