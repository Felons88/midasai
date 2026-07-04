import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { createCreditService } from "@/lib/billing/credits"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
})

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata

        if (metadata?.pack_id && metadata?.user_id && metadata?.credits) {
          const packId = metadata.pack_id
          const userId = metadata.user_id
          const credits = parseInt(metadata.credits, 10)

          // Check if this session has already been processed
          const { data: existingTransaction } = await supabase
            .from("credit_transactions")
            .select("id")
            .eq("reference_id", session.id)
            .eq("type", "purchase")
            .maybeSingle()

          if (existingTransaction) {
            console.log("Session already processed, skipping")
            break
          }

          // Add purchased credits to user balance
          const creditSvc = createCreditService(supabase)
          
          await creditSvc.addPurchasedCredits(
            { userId },
            credits,
            session.id,
            `Credit pack purchase: ${packId}`
          )

          // Record transaction
          await supabase.from("credit_transactions").insert({
            user_id: userId,
            type: "purchase",
            status: "completed",
            amount: credits,
            reference_id: session.id,
            description: `Credit pack purchase: ${packId}`,
            metadata: { pack_id: packId, credits: credits },
          })

          console.log(`Added ${credits} credits to user ${userId} for pack ${packId}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
