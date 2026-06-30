type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60 * 60 * 1000
): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  buckets.set(key, existing)
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  }
}
