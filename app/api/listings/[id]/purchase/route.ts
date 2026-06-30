import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

const PLATFORM_FEE_PERCENT = 15

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, creator_id, status, files")
      .eq("id", listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: existing } = await service
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .eq("status", "COMPLETED")
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, alreadyOwned: true })
    }

    const amount = Number(listing.price) || 0
    const fee = amount > 0 ? (amount * PLATFORM_FEE_PERCENT) / 100 : 0
    const netAmount = amount - fee

    if (amount > 0) {
      const stripe = getStripe()
      if (!stripe) {
        return NextResponse.json(
          {
            error: "Paid listings require Stripe checkout. Configure STRIPE_SECRET_KEY.",
            code: "STRIPE_REQUIRED",
          },
          { status: 503 }
        )
      }

      const origin = new URL(_request.url).origin
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email ?? undefined,
        metadata: {
          listing_id: listingId,
          user_id: user.id,
          creator_id: listing.creator_id,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: listing.title,
              },
            },
          },
        ],
        success_url: `${origin}/listing/${listingId}?purchase=success`,
        cancel_url: `${origin}/listing/${listingId}?purchase=cancelled`,
      })

      return NextResponse.json({ checkoutUrl: session.url, code: "STRIPE_CHECKOUT" })
    }

    const { data: transaction, error: txError } = await service
      .from("transactions")
      .insert({
        user_id: user.id,
        listing_id: listingId,
        creator_id: listing.creator_id,
        type: "PURCHASE",
        status: "COMPLETED",
        amount,
        fee,
        net_amount: netAmount,
      })
      .select("id")
      .single()

    if (txError) {
      // Unique violation — already purchased (race condition), treat as owned
      if (txError.code === "23505") {
        return NextResponse.json({ success: true, alreadyOwned: true })
      }
      console.error("Purchase transaction error:", JSON.stringify(txError))
      return NextResponse.json(
        { error: "Failed to record purchase", detail: txError.message, code: txError.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      free: amount === 0,
    })
  } catch (error) {
    console.error("Purchase API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
