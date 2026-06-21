export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://rqermggomchlipmuigan.supabase.co https://generativelanguage.googleapis.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
    ].join(', '),
    
    // Strict Transport Security (only in production)
    ...(process.env.NODE_ENV === 'production' ? {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    } : {}),
  }
  
  return headers
}

export function addSecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders()
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}
