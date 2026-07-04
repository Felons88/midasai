import { createServiceClient } from "@/lib/supabase/server"
import { getStripe, getStripeWebhookSecret, computeFees } from "@/lib/stripe"
import { syncSubscriptionRecord, tierFromMetadata } from "@/lib/billing/stripe-subscription"
import { NextResponse } from "next/server"
import type Stripe from "stripe"

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE"
    case "canceled":
      return "CANCELLED"
    case "past_due":
    case "unpaid":
      return "PENDING"
    default:
      return "EXPIRED"
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id ?? session.client_reference_id
  const tier = tierFromMetadata(session.metadata?.tier)

  if (!userId || !tier || tier === "FREE") return

  const stripe = getStripe()
  if (!stripe || !session.subscription) return

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const service = createServiceClient()

  await syncSubscriptionRecord(service, {
    userId,
    tier,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id ?? null,
    status: mapStripeSubscriptionStatus(subscription.status),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId =
    subscription.metadata?.user_id ?? subscription.metadata?.userId ?? null
  const tier = tierFromMetadata(subscription.metadata?.tier)

  if (!userId || !tier) return

  const service = createServiceClient()

  await syncSubscriptionRecord(service, {
    userId,
    tier,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id ?? null,
    status: mapStripeSubscriptionStatus(subscription.status),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = getStripeWebhookSecret()

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode === "subscription") {
      await handleSubscriptionCheckout(session)
      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const redirectUrl = new URL(`${origin}/account/billing`);
      redirectUrl.searchParams.set("success", "1");
      redirectUrl.searchParams.set("tier", session.metadata?.tier ?? "FREE");
      return NextResponse.redirect(redirectUrl, { status: 302 });
    } else {
      const listingId = session.metadata?.listing_id
      const userId = session.metadata?.user_id
      const creatorId = session.metadata?.creator_id

      if (listingId && userId) {
        const amount = (session.amount_total ?? 0) / 100
        const { fee, netAmount } = computeFees(amount)
        const service = createServiceClient()

        const { data: existing } = await service
          .from("transactions")
          .select("id")
          .eq("stripe_payment_intent_id", session.payment_intent as string)
          .maybeSingle()

        if (!existing) {
          await service.from("transactions").insert({
            user_id: userId,
            listing_id: listingId,
            creator_id: creatorId ?? null,
            type: "PURCHASE",
            status: "COMPLETED",
            amount,
            fee,
            net_amount: netAmount,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
        }
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.user_id
    const tier = tierFromMetadata(subscription.metadata?.tier) ?? "PRO"
    if (userId) {
      const service = createServiceClient()
      await syncSubscriptionRecord(service, {
        userId,
        tier,
        stripeSubscriptionId: subscription.id,
        status: "CANCELLED",
        cancelAtPeriodEnd: true,
      })
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id

    if (paymentIntentId) {
      const service = createServiceClient()
      await service
        .from("transactions")
        .update({ status: "REFUNDED", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntentId)
        .eq("status", "COMPLETED")
    }
  }

  return NextResponse.json({ received: true })
}
