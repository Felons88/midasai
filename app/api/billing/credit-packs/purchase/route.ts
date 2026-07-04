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
    const { packId } = await request.json()

    if (!packId) {
      return NextResponse.json({ error: "Pack ID is required" }, { status: 400 })
    }

    // Get credit pack details
    const { data: pack, error: packError } = await supabase
      .from("credit_packs")
      .select("*")
      .eq("id", packId)
      .eq("is_active", true)
      .single()

    if (packError || !pack) {
      return NextResponse.json({ error: "Credit pack not found" }, { status: 404 })
    }

    if (!pack.stripe_price_id) {
      return NextResponse.json({ error: "Credit pack not available for purchase" }, { status: 400 })
    }

    // Get or create Stripe customer
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
    
    let customerId = null
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id
    } else {
      // Create new customer
      const { data: userData } = await supabase.auth.getUser()
      const customer = await stripe.customers.create({
        email: userData.user?.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: pack.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/wallet?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/wallet/credit-packs`,
      metadata: {
        pack_id: packId,
        user_id: user.id,
        credits: pack.credits.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
