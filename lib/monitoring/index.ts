/**
 * Error tracking and analytics utilities
 * Integrates with error tracking services and analytics platforms
 */

export interface ErrorContext {
  userId?: string
  userEmail?: string
  path?: string
  userAgent?: string
  timestamp: string
  [key: string]: unknown
}

export interface ErrorLog {
  message: string
  stack?: string
  context: ErrorContext
  level: 'error' | 'warning' | 'info'
}

/**
 * Log error to error tracking service
 * In production, this would send to Sentry, LogRocket, or similar
 */
export async function logError(error: Error | string, context: Partial<ErrorContext> = {}) {
  const errorLog: ErrorLog = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    },
    level: 'error',
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Tracking]', errorLog)
    return
  }

  // In production, send to error tracking service
  // Example: await sendToSentry(errorLog)
  // Example: await sendToLogRocket(errorLog)
  
  // For now, log to Supabase for internal tracking
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    await supabase.from('error_logs').insert({
      message: errorLog.message,
      stack: errorLog.stack,
      context: errorLog.context,
      level: errorLog.level,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    // If error logging fails, just log to console
    console.error('[Error Tracking Failed]', errorLog, e)
  }
}

/**
 * Track page view for analytics
 */
export async function trackPageView(path: string, userId?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page View:', { path, userId })
    return
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    await supabase.from('page_views').insert({
      path,
      user_id: userId || null,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[Analytics Failed]', e)
  }
}

/**
 * Track custom event for analytics
 */
export async function trackEvent(
  event: string,
  properties: Record<string, unknown> = {},
  userId?: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Event:', { event, properties, userId })
    return
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    await supabase.from('analytics_events').insert({
      event,
      properties,
      user_id: userId || null,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[Analytics Failed]', e)
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  /**
   * Start measuring a named operation
   */
  start(name: string) {
    this.marks.set(name, performance.now())
  }

  /**
   * End measuring a named operation and return duration in ms
   */
  end(name: string): number {
    const start = this.marks.get(name)
    if (!start) {
      console.warn(`Performance mark "${name}" not found`)
      return 0
    }
    
    const duration = performance.now() - start
    this.measures.set(name, duration)
    this.marks.delete(name)
    
    return duration
  }

  /**
   * Get all measured durations
   */
  getMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures)
  }

  /**
   * Log slow operations (threshold in ms)
   */
  logSlowOperations(threshold: number = 1000) {
    const measures = this.getMeasures()
    const slowOps = Object.entries(measures).filter(([_, duration]) => duration > threshold)
    
    if (slowOps.length > 0) {
      console.warn('[Performance] Slow operations detected:', slowOps)
      
      // Log to analytics in production
      if (process.env.NODE_ENV === 'production') {
        slowOps.forEach(([name, duration]) => {
          trackEvent('slow_operation', { name, duration })
        })
      }
    }
  }
}

/**
 * Global performance monitor instance
 */
export const perfMonitor = new PerformanceMonitor()
