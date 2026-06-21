import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitHeaders } from './rate-limit'

export async function rateLimitMiddleware(
  request: NextRequest,
  type: 'api' | 'auth' | 'upload' | 'webhook' = 'api'
): Promise<NextResponse | null> {
  // Get identifier from IP or user ID
  const identifier = getIdentifier(request)
  
  // Check rate limit
  const result = await checkRateLimit(identifier, type)
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(result)
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil(result.reset - Date.now() / 1000).toString(),
        }
      }
    )
  }
  
  return null // Rate limit check passed
}

function getIdentifier(request: NextRequest): string {
  // Try to get user ID from session
  const userId = request.headers.get('x-user-id')
  if (userId) return `user:${userId}`
  
  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown'
  
  return `ip:${ip}`
}

export function withRateLimit(
  type: 'api' | 'auth' | 'upload' | 'webhook' = 'api'
) {
  return async (request: NextRequest) => {
    const rateLimitResult = await rateLimitMiddleware(request, type)
    
    if (rateLimitResult) {
      return rateLimitResult
    }
    
    // Continue with the request
    return null
  }
}
