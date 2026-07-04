import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
    
    // Resume subscription
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update local subscription record
    await supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resuming subscription:", error)
    return NextResponse.json({ error: "Failed to resume subscription" }, { status: 500 })
  }
}
