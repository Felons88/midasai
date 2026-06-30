import { createClient } from "@/lib/supabase/server"
import { getBillingContext } from "@/lib/billing/entitlements"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const context = await getBillingContext(supabase, user.id)

  return NextResponse.json({
    tier: context.limits.tier,
    showAds: context.limits.tier === "FREE",
    limits: context.limits,
    usage: context.usage,
  })
}
