import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const origin = new URL(request.url).origin
  const service = createServiceClient()

  const { data: accountRow } = await service
    .from("creator_accounts")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle()

  let stripeAccountId = accountRow?.stripe_account_id ?? null

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
      capabilities: {
        transfers: { requested: true },
      },
    })

    stripeAccountId = account.id

    await service.from("creator_accounts").upsert(
      {
        user_id: user.id,
        stripe_account_id: stripeAccountId,
        verification_status: "pending",
      },
      { onConflict: "user_id" }
    )
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/creator/payouts?connect=refresh`,
    return_url: `${origin}/creator/payouts?connect=success`,
    type: "account_onboarding",
  })

  return NextResponse.json({ url: accountLink.url })
}
