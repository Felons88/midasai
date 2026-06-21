import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Get creator's Stripe Connect account from database
    const { data: creatorAccount } = await supabase
      .from("creator_accounts")
      .select("stripe_account_id, verification_status")
      .eq("user_id", user.id)
      .single()

    if (!creatorAccount?.stripe_account_id) {
      return NextResponse.json({ 
        verified: false, 
        status: 'NOT_STARTED',
        hasAccount: false 
      })
    }

    // Fetch account status from Stripe
    const accountRes = await fetch(`https://api.stripe.com/v1/accounts/${creatorAccount.stripe_account_id}`, {
      headers: {
        Authorization: `Bearer ${stripeKey}`,
      },
    })

    const account = await accountRes.json()
    if (!accountRes.ok) throw new Error(account.error?.message || "Failed to fetch account")

    // Determine verification status
    let verificationStatus = 'PENDING'
    if (account.charges_enabled && account.payouts_enabled) {
      verificationStatus = 'VERIFIED'
    } else if (account.details_submitted) {
      verificationStatus = 'REVIEW'
    }

    // Update database if status changed
    if (creatorAccount.verification_status !== verificationStatus) {
      await supabase.from("creator_accounts").update({
        verification_status: verificationStatus,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id)
    }

    return NextResponse.json({
      verified: verificationStatus === 'VERIFIED',
      status: verificationStatus,
      hasAccount: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
    })
  } catch (err) {
    console.error("[stripe/connect/status]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
