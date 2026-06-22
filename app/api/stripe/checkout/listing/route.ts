import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateBody, stripeListingCheckoutSchema } from "@/lib/validation/schemas"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const validatedData = await validateBody(stripeListingCheckoutSchema, body)
    
    const { listingId, listingTitle, listingPrice, creatorId } = validatedData

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })

    // Get platform fee from settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("platform_fee")
      .single()
    
    const platformFee = settings?.platform_fee || 15
    const platformFeeAmount = (listingPrice * platformFee) / 100
    const creatorPayoutAmount = listingPrice - platformFeeAmount

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

    // Create Checkout Session for one-time payment
    const params = new URLSearchParams({
      customer: stripeCustomerId!,
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": listingTitle,
      "line_items[0][price_data][product_data][metadata][listing_id]": listingId,
      "line_items[0][price_data][unit_amount]": Math.round(listingPrice * 100).toString(),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: `${origin}/listing/${listingId}?purchase=success`,
      cancel_url: `${origin}/listing/${listingId}?purchase=cancelled`,
      "payment_intent_data[metadata][user_id]": user.id,
      "payment_intent_data[metadata][listing_id]": listingId,
      "payment_intent_data[metadata][creator_id]": creatorId,
      "payment_intent_data[metadata][platform_fee]": platformFeeAmount.toString(),
      "payment_intent_data[metadata][creator_payout]": creatorPayoutAmount.toString(),
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
    console.error("[stripe/checkout/listing]", err)
    
    // Handle validation errors
    if (err instanceof Error && err.message.startsWith('[')) {
      const validationErrors = JSON.parse(err.message)
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
