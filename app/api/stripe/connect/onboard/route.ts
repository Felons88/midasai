import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Check if creator already has a Stripe Connect account
    const { data: existingAccount } = await supabase
      .from("creator_accounts")
      .select("stripe_account_id, verification_status")
      .eq("user_id", user.id)
      .single()

    let stripeAccountId: string

    if (existingAccount?.stripe_account_id) {
      // Use existing account
      stripeAccountId = existingAccount.stripe_account_id
    } else {
      // Create new Stripe Connect account for this creator
      const accountRes = await fetch("https://api.stripe.com/v1/accounts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          type: 'express',
          country: 'US',
          email: user.email || '',
          capabilities: JSON.stringify({
            transfers: { requested: true },
            card_payments: { requested: true },
          }),
          business_type: 'individual',
          business_profile: JSON.stringify({
            url: process.env.NEXT_PUBLIC_APP_URL || 'https://midasai.tech',
            mcc: '5734', // Computer software stores
          }),
        }),
      })

      const account = await accountRes.json()
      if (!accountRes.ok) throw new Error(account.error?.message || "Failed to create Stripe account")
      
      stripeAccountId = account.id

      // Save to database
      await supabase.from("creator_accounts").insert({
        user_id: user.id,
        stripe_account_id: stripeAccountId,
        verification_status: 'PENDING',
        charges_enabled: false,
        payouts_enabled: false,
        available_balance: 0,
        pending_balance: 0,
        lifetime_revenue: 0,
        platform_fees_paid: 0,
      })
    }

    // Create account link for onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const accountLinkParams = new URLSearchParams({
      account: stripeAccountId,
      refresh_url: `${appUrl}/creator/settings`,
      return_url: `${appUrl}/creator/settings?verification=success`,
      type: 'account_onboarding',
    })

    const accountLinkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: accountLinkParams,
    })

    const accountLink = await accountLinkRes.json()
    if (!accountLinkRes.ok) throw new Error(accountLink.error?.message || "Failed to create account link")

    return NextResponse.json({ url: accountLink.url, accountId: stripeAccountId })
  } catch (err) {
    console.error("[stripe/connect/onboard]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
