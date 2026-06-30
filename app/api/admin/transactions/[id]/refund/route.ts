import { requireAdmin } from "@/lib/auth/roles"
import { createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: transactionId } = await params
  const service = createServiceClient()

  const { data: transaction, error } = await service
    .from("transactions")
    .select("id, status, amount, stripe_payment_intent_id, user_id, listing_id")
    .eq("id", transactionId)
    .maybeSingle()

  if (error || !transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  if (transaction.status === "REFUNDED") {
    return NextResponse.json({ error: "Already refunded" }, { status: 400 })
  }

  if (transaction.status !== "COMPLETED") {
    return NextResponse.json({ error: "Only completed purchases can be refunded" }, { status: 400 })
  }

  const stripe = getStripe()
  if (stripe && transaction.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create({
        payment_intent: transaction.stripe_payment_intent_id,
      })
    } catch (err) {
      console.error("Stripe refund error:", err)
      return NextResponse.json({ error: "Stripe refund failed" }, { status: 502 })
    }
  }

  const { error: updateError } = await service
    .from("transactions")
    .update({ status: "REFUNDED", updated_at: new Date().toISOString() })
    .eq("id", transactionId)

  if (updateError) {
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }

  if (transaction.user_id) {
    await service.from("notifications").insert({
      user_id: transaction.user_id,
      title: "Purchase refunded",
      message: "Your purchase has been refunded.",
      read: false,
      priority: "normal",
      type: "MARKETPLACE",
      metadata: { transaction_id: transactionId, listing_id: transaction.listing_id },
    })
  }

  return NextResponse.json({ success: true, transactionId })
}
