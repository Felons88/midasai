import { createClient } from '@/lib/supabase/server'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface RateLimitConfig {
  limit: number
  window: number // in seconds
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
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
  
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window
  
  try {
    // Check existing rate limit record
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('type', type)
      .single()
    
    if (existing) {
      // Clean up old requests outside the window
      const recentRequests = existing.requests.filter((timestamp: number) => timestamp > windowStart)
      
      if (recentRequests.length >= config.limit) {
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: existing.reset_at,
        }
      }
      
      // Add current request
      recentRequests.push(now)
      
      // Update record
      await supabase
        .from('rate_limits')
        .update({
          requests: recentRequests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - recentRequests.length,
        reset: existing.reset_at,
      }
    } else {
      // Create new rate limit record
      const resetAt = now + config.window
      
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          type,
          requests: [now],
          reset_at: resetAt,
        })
      
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - 1,
        reset: resetAt,
      }
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: now + config.window,
    }
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}
