import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getReserveCredits } from "@/lib/billing/pricing"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featureKey = searchParams.get("featureKey")
    const units = parseInt(searchParams.get("units") ?? "1", 10)

    if (!featureKey) {
      return NextResponse.json({ error: "featureKey is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cost = await getReserveCredits(supabase, featureKey, units)

    return NextResponse.json({ featureKey, units, cost })
  } catch (error) {
    console.error("[api/billing/pricing] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
