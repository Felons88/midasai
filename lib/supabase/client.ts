import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build/prerendering, env vars may not be available.
    // Return a dummy client that won't crash but won't work either.
    _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
    return _supabase
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

export const supabase = getSupabase()
