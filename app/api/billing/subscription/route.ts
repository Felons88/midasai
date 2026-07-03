import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, current_period_start, cancel_at_period_end, stripe_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["ACTIVE", "TRIALING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ subscription })
}
