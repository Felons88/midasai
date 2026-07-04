import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
    
    // Get invoice from Stripe
    const invoice = await stripe.invoices.retrieve(params.id)
    
    // Get invoice PDF URL
    const invoicePdf = await stripe.invoices.retrievePdf(params.id)
    
    return NextResponse.json({ url: invoicePdf })
  } catch (error) {
    console.error("Error downloading invoice:", error)
    return NextResponse.json({ error: "Failed to download invoice" }, { status: 500 })
  }
}
