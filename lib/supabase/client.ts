import { type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Single browser-side Supabase client — shared across the whole app.
// Multiple instances sharing the same storage key cause GoTrueClient warnings.
let _client: SupabaseClient | null = null

function getBrowserClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) as unknown as SupabaseClient
  }
  return _client
}

export const supabase = getBrowserClient()

export function createBrowserSupabaseClient(): SupabaseClient {
  return getBrowserClient()
}

export function createClient(): SupabaseClient {
  return getBrowserClient()
}
