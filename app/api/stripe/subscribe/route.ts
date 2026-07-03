import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { getStripePriceId } from "@/lib/stripe/config"
import { getResolvedPlan, type PlanTier } from "@/lib/billing/plans"
import { NextResponse } from "next/server"
import { z } from "zod"

const subscribeSchema = z.object({
  tier: z.enum(["PRO", "TEAM", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const body = await request.json()
  const parsed = subscribeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  const { tier, interval } = parsed.data

  const plan = await getResolvedPlan(supabase, tier as PlanTier)
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 })
  }

  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly
  if (price <= 0) {
    return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
  }

  const priceId = getStripePriceId(tier, interval)
  const origin = new URL(request.url).origin

  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          unit_amount: price,
          recurring: { interval: interval === "yearly" ? "year" : "month" },
          product_data: {
            name: `MidasAI ${tier}`,
            description: "MidasAI subscription",
          },
        },
        quantity: 1,
      }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      tier,
      interval,
      checkout_type: "subscription",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        tier,
        interval,
      },
    },
    line_items: [lineItem],
    success_url: `${origin}/account/billing?subscribed=success`,
    cancel_url: `${origin}/account/billing?subscribed=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
