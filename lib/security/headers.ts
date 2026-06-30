function buildContentSecurityPolicy(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://js.stripe.com",
    "https://checkout.stripe.com",
    // AdSense — always included (public CDN, no risk)
    "https://pagead2.googlesyndication.com",
    "https://www.googletagservices.com",
    "https://adservice.google.com",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://partner.googleadservices.com",
  ]

  const connectSrc = [
    "'self'",
    "https://api.stripe.com",
    "https://rqermggomchlipmuigan.supabase.co",
    "https://generativelanguage.googleapis.com",
    // AdSense + Ad traffic quality
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://adservice.google.com",
    "https://partner.googleadservices.com",
    "https://ep1.adtrafficquality.google",
    "https://ep2.adtrafficquality.google",
  ]

  const frameSrc = [
    "'self'",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    // AdSense
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com",
    "https://www.google.com",
    "https://fundingchoicesmessages.google.com",
  ]

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; ")
}

export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(),

    // XSS Protection
    "X-XSS-Protection": "1; mode=block",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy
    "Permissions-Policy": ["camera=()", "microphone=()", "geolocation=()", "payment=(self)"].join(
      ", "
    ),

    // Strict Transport Security (only in production)
    ...(process.env.NODE_ENV === "production"
      ? {
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        }
      : {}),
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
