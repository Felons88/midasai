import { createClient } from '@/lib/supabase/server'

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

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof DEFAULT_LIMITS = 'api'
): Promise<RateLimitResult> {
  const config = DEFAULT_LIMITS[type]
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .rpc('check_rate_limit_bucket', {
        p_key: `${type}:${identifier}`,
        p_limit: config.limit,
        p_window_seconds: config.window,
      })

    if (error || !data || data.length === 0) {
      console.error('Rate limit check error:', error)
      return failOpen(config)
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
    return failOpen(config)
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

function failOpen(config: RateLimitConfig): RateLimitResult {
  const now = Math.floor(Date.now() / 1000)
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit,
    reset: now + config.window,
  }
}
