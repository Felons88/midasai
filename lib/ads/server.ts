import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTier } from "@/lib/billing/entitlements"
import { isAdsConfigured, tierShowsAds } from "@/lib/ads/config"

export async function shouldShowAdsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!isAdsConfigured()) return false
  const tier = await resolveUserTier(supabase, userId)
  return tierShowsAds(tier)
}

/** Guests and FREE-tier subscribers see ads; PRO/ENTERPRISE do not. */
export async function shouldShowAdsForSession(): Promise<boolean> {
  if (!isAdsConfigured()) return false

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return true

  return shouldShowAdsForUser(supabase, user.id)
}
