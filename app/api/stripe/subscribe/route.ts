import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { getStripePriceId } from "@/lib/stripe/config"
import { SUBSCRIPTION_TIERS } from "@/lib/monetization"
import { NextResponse } from "next/server"
import { z } from "zod"

const subscribeSchema = z.object({
  tier: z.enum(["PRO", "ENTERPRISE"]),
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

  const { tier } = parsed.data
  const tierConfig = SUBSCRIPTION_TIERS.find((t) => t.tier === tier)

  if (!tierConfig || tierConfig.price <= 0) {
    return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
  }

  const priceId =
    tier === "PRO"
      ? getStripePriceId("PRO", "monthly")
      : getStripePriceId("BUSINESS", "monthly")

  const origin = new URL(request.url).origin

  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(tierConfig.price * 100),
          recurring: { interval: tierConfig.interval },
          product_data: {
            name: `MidasAI ${tier}`,
            description: tierConfig.features.slice(0, 3).join(" · "),
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
      checkout_type: "subscription",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        tier,
      },
    },
    line_items: [lineItem],
    success_url: `${origin}/account/billing?subscribed=success`,
    cancel_url: `${origin}/account/billing?subscribed=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
