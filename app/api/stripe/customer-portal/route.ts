import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })

    const { data: customer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found. Purchase a plan first." }, { status: 404 })
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const params = new URLSearchParams({
      customer: customer.stripe_customer_id,
      return_url: `${origin}/developer/billing`,
    })

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })
    const portal = await portalRes.json()
    if (!portalRes.ok) throw new Error(portal.error?.message || "Failed to create portal session")

    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error("[stripe/customer-portal]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
