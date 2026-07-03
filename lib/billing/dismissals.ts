/**
 * Dismissal persistence for upgrade/credit prompts.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type DismissalDuration = "1d" | "3d" | "7d" | "30d" | "never"

export async function isPromptDismissed(
  supabase: SupabaseClient,
  userId: string,
  promptKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("dismissed_prompts")
    .select("id")
    .eq("user_id", userId)
    .eq("prompt_key", promptKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error("[dismissals] isPromptDismissed error:", error)
    return false
  }
  return !!data
}

export async function dismissPrompt(
  supabase: SupabaseClient,
  userId: string,
  promptKey: string,
  duration: DismissalDuration = "7d",
  metadata: Record<string, unknown> = {}
): Promise<void> {
  let expiresAt: Date
  switch (duration) {
    case "1d":
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      break
    case "3d":
      expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      break
    case "7d":
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      break
    case "30d":
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      break
    case "never":
    default:
      expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
      break
  }

  const { error } = await supabase.from("dismissed_prompts").upsert(
    {
      user_id: userId,
      prompt_key: promptKey,
      dismissed_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      metadata,
    },
    { onConflict: "user_id,prompt_key" }
  )

  if (error) {
    console.error("[dismissals] dismissPrompt error:", error)
  }
}

export async function revokeDismissal(
  supabase: SupabaseClient,
  userId: string,
  promptKey: string
): Promise<void> {
  const { error } = await supabase
    .from("dismissed_prompts")
    .delete()
    .eq("user_id", userId)
    .eq("prompt_key", promptKey)

  if (error) {
    console.error("[dismissals] revokeDismissal error:", error)
  }
}
