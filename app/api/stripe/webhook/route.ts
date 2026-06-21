import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PLAN_LIMITS, PlanTier, getPlanLimits } from "@/lib/subscriptions"

export const runtime = "nodejs"

function tierFromPriceId(priceId: string): PlanTier {
  for (const [tier, limits] of Object.entries(PLAN_LIMITS)) {
    if (
      limits.stripePriceIdMonthly === priceId ||
      limits.stripePriceIdYearly === priceId
    ) {
      return tier as PlanTier
    }
  }
  return "FREE"
}

async function upsertEntitlements(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, tier: PlanTier) {
  const limits = getPlanLimits(tier)
  await supabase.from("feature_entitlements").upsert({
    user_id: userId,
    tier,
    api_rate_limit: limits.apiRateLimit,
    storage_gb: limits.storageGb,
    max_listings: limits.maxListings,
    max_mcp_servers: limits.maxMcpServers,
    max_webhooks: limits.maxWebhooks,
    max_applications: limits.maxApplications,
    platform_fee_pct: limits.platformFeePct,
    can_use_ai_upload: limits.canUseAiUpload,
    can_use_custom_domain: limits.canUseCustomDomain,
    can_verify_creator: limits.canVerifyCreator,
    max_featured_listings: limits.maxFeaturedListings,
    analytics_tier: limits.analyticsTier,
    support_tier: limits.supportTier,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get("stripe-signature") || ""

  // Verify signature using Web Crypto (no stripe SDK needed)
  try {
    const parts = sig.split(",")
    const tPart = parts.find((p) => p.startsWith("t="))
    const v1Part = parts.find((p) => p.startsWith("v1="))
    if (!tPart || !v1Part) throw new Error("Invalid signature format")

    const timestamp = tPart.slice(2)
    const receivedSig = v1Part.slice(3)
    const signedPayload = `${timestamp}.${body}`

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload))
    const computedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    if (computedSig !== receivedSig) throw new Error("Signature mismatch")

    // Replay protection: reject events older than 5 minutes
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
      throw new Error("Timestamp too old")
    }
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(body)
  const supabase = await createClient()

  // Idempotency check
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single()

  if (existing) return NextResponse.json({ received: true, skipped: true })

  await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    processed: false,
    payload: event,
  })

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.user_id || session.subscription_data?.metadata?.user_id
        if (!userId) break
        const sub = session.subscription
        // Fetch subscription to get price
        if (sub) {
          const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${sub}`, {
            headers: { Authorization: `Bearer ${stripeKey}` },
          })
          const subData = await subRes.json()
          const priceId = subData.items?.data?.[0]?.price?.id
          const tier = tierFromPriceId(priceId)
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            tier,
            status: "ACTIVE",
            stripe_subscription_id: sub,
            stripe_price_id: priceId,
            stripe_customer_id: session.customer,
            current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          await upsertEntitlements(supabase, userId, tier)
          await supabase.from("billing_events").insert({
            user_id: userId,
            event_type: "subscription.created",
            stripe_event_id: event.id,
            metadata: { tier, price_id: priceId },
          })
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object
        const userId = paymentIntent.metadata?.user_id
        const listingId = paymentIntent.metadata?.listing_id
        const creatorId = paymentIntent.metadata?.creator_id
        const platformFee = parseFloat(paymentIntent.metadata?.platform_fee || "0")
        const creatorPayout = parseFloat(paymentIntent.metadata?.creator_payout || "0")

        if (!userId || !listingId || !creatorId) break

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: userId,
          listing_id: listingId,
          creator_id: creatorId,
          type: "PURCHASE",
          status: "COMPLETED",
          amount: paymentIntent.amount / 100, // Convert from cents
          platform_fee: platformFee,
          creator_payout: creatorPayout,
          stripe_payment_intent_id: paymentIntent.id,
          created_at: new Date().toISOString(),
        })

        // Increment listing downloads count
        await supabase.from("listings")
          .update({ downloads: (await supabase.from("listings").select("downloads").eq("id", listingId).single()).data?.downloads || 0 + 1 })
          .eq("id", listingId)

        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: "purchase.completed",
          stripe_event_id: event.id,
          metadata: { listing_id: listingId, amount: paymentIntent.amount / 100 },
        })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object
        const userId = sub.metadata?.user_id
        if (!userId) break
        const priceId = sub.items?.data?.[0]?.price?.id
        const tier = tierFromPriceId(priceId)
        const status = sub.status === "active" ? "ACTIVE"
          : sub.status === "canceled" ? "CANCELLED"
          : sub.status === "past_due" ? "EXPIRED"
          : "PENDING"
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          tier: status === "ACTIVE" ? tier : "FREE",
          status,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          stripe_customer_id: sub.customer,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        await upsertEntitlements(supabase, userId, status === "ACTIVE" ? tier : "FREE")
        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: "subscription.updated",
          stripe_event_id: event.id,
          metadata: { tier, status },
        })
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object
        const userId = sub.metadata?.user_id
        if (!userId) break
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          tier: "FREE",
          status: "CANCELLED",
          stripe_subscription_id: sub.id,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        await upsertEntitlements(supabase, userId, "FREE")
        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: "subscription.cancelled",
          stripe_event_id: event.id,
          metadata: {},
        })
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object
        const userId = invoice.subscription_details?.metadata?.user_id
        if (!userId) break
        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: "invoice.paid",
          amount: invoice.amount_paid,
          currency: invoice.currency,
          stripe_event_id: event.id,
          metadata: { invoice_id: invoice.id },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const userId = invoice.subscription_details?.metadata?.user_id
        if (!userId) break
        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: "invoice.payment_failed",
          stripe_event_id: event.id,
          metadata: { invoice_id: invoice.id },
        })
        break
      }

      case "charge.refunded": {
        const charge = event.data.object
        const custRes = await fetch(`https://api.stripe.com/v1/customers/${charge.customer}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        })
        const cust = await custRes.json()
        const userId = cust.metadata?.user_id
        if (!userId) break
        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: "charge.refunded",
          amount: charge.amount_refunded,
          currency: charge.currency,
          stripe_event_id: event.id,
          metadata: { charge_id: charge.id },
        })
        break
      }
    }

    await supabase.from("stripe_events").update({ processed: true }).eq("stripe_event_id", event.id)
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err)
  }

  return NextResponse.json({ received: true })
}
