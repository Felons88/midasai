/**
 * Supabase Realtime utilities for live updates
 * Enables real-time data synchronization across the application
 */

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeEvent = RealtimePostgresChangesPayload<any>

export interface RealtimeSubscriptionOptions {
  table: string
  filter?: string
  schema?: string
  onInsert?: (payload: RealtimeEvent) => void
  onUpdate?: (payload: RealtimeEvent) => void
  onDelete?: (payload: RealtimeEvent) => void
  onError?: (error: Error) => void
}

/**
 * Subscribe to real-time changes on a table
 */
export function subscribeToTable(
  options: RealtimeSubscriptionOptions
): RealtimeChannel {
  const supabase = createBrowserSupabaseClient()
  const { table, filter, schema = 'public', onInsert, onUpdate, onDelete, onError } = options

  const channelName = `${schema}:${table}:${filter || 'all'}`
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema,
        table,
        filter,
      },
      (payload: RealtimeEvent) => {
        switch (payload.eventType) {
          case 'INSERT':
            onInsert?.(payload)
            break
          case 'UPDATE':
            onUpdate?.(payload)
            break
          case 'DELETE':
            onDelete?.(payload)
            break
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Realtime subscription error'))
      }
    })

  return channel
}

/**
 * Unsubscribe from a realtime channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel) {
  const supabase = createBrowserSupabaseClient()
  if (channel) {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to notifications for the current user
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (payload: RealtimeEvent) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: onNewNotification,
    onError,
  })
}

/**
 * Subscribe to listing updates (for creators watching their listings)
 */
export function subscribeToListings(
  creatorId: string,
  onUpdate: (payload: RealtimeEvent) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'listings',
    filter: `creator_id=eq.${creatorId}`,
    onUpdate,
    onError,
  })
}

/**
 * Subscribe to subscription/plan changes
 */
export function subscribeToSubscription(
  userId: string,
  onUpdate: (payload: RealtimeEvent) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'feature_entitlements',
    filter: `user_id=eq.${userId}`,
    onUpdate,
    onError,
  })
}

/**
 * React hook for realtime subscriptions
 */
export function useRealtimeSubscription(
  options: RealtimeSubscriptionOptions,
  deps: any[] = []
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const newChannel = subscribeToTable({
      ...options,
      onError: (err) => {
        setError(err)
        options.onError?.(err)
      },
    })
    
    setChannel(newChannel)

    return () => {
      if (newChannel) {
        unsubscribeFromChannel(newChannel)
      }
    }
  }, deps)

  return { channel, error }
}
