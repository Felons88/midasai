import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ methods: [] })
    }

    // Fetch payment methods from Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: subscription.stripe_customer_id,
      type: "card",
    })

    const methods = paymentMethods.data.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      brand: pm.card?.brand || "unknown",
      last4: pm.card?.last4 || "0000",
      expMonth: pm.card?.exp_month || 0,
      expYear: pm.card?.exp_year || 0,
      isDefault: false, // Will be updated below
    }))

    // Get default payment method from customer
    const customer = await stripe.customers.retrieve(subscription.stripe_customer_id)
    const defaultMethodId = (customer as any).invoice_settings?.default_payment_method

    if (defaultMethodId) {
      const defaultMethod = methods.find((m: any) => m.id === defaultMethodId)
      if (defaultMethod) {
        defaultMethod.isDefault = true
      }
    }

    return NextResponse.json({ methods })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}
