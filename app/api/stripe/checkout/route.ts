import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPlanLimits, PlanTier } from "@/lib/subscriptions"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tier, interval = "monthly" } = await request.json() as { tier: PlanTier; interval: "monthly" | "yearly" }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey || stripeKey.includes("dummy")) {
      return NextResponse.json({ error: "Stripe is not configured with a real secret key" }, { status: 500 })
    }

    const plan = getPlanLimits(tier)
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

    const priceId = interval === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly
    if (!priceId) {
      return NextResponse.json({ error: `Stripe price ID not configured for ${tier} ${interval}. Add STRIPE_${tier}_MONTHLY_PRICE_ID to your environment.` }, { status: 400 })
    }
    if (!priceId.startsWith("price_")) {
      return NextResponse.json({ error: `Invalid Stripe price ID for ${tier}: ${priceId}` }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null
    const { data: existing } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (existing?.stripe_customer_id) {
      stripeCustomerId = existing.stripe_customer_id
    } else {
      const custRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email: user.email || "", "metadata[user_id]": user.id }),
      })
      const cust = await custRes.json()
      if (!custRes.ok) throw new Error(cust.error?.message || "Failed to create customer")
      stripeCustomerId = cust.id

      await supabase.from("stripe_customers").insert({
        user_id: user.id,
        stripe_customer_id: cust.id,
        email: user.email || null,
      })
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Checkout Session
    const params = new URLSearchParams({
      customer: stripeCustomerId!,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${origin}/account/billing?success=1&tier=${tier}`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][tier]": tier,
    })

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })
    const session = await sessionRes.json()
    if (!sessionRes.ok) throw new Error(session.error?.message || "Failed to create session")

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[stripe/checkout]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
