import { createClient } from "@/lib/supabase/server"
import { createCreditService } from "@/lib/billing/credits"
import { getUsageForecast } from "@/lib/billing/forecast"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creditService = createCreditService(supabase)
  const [balance, forecast] = await Promise.all([
    creditService.getBalance({ userId: user.id }),
    getUsageForecast(supabase, { userId: user.id }),
  ])

  return NextResponse.json({
    balance,
    forecast,
  })
}
