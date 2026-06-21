import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/referrals/apply - Apply a referral code during signup
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // Find the referral code
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single()

    if (codeError || !referralCode) {
      return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 400 })
    }

    // Check if user already referred
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', user.id)
      .single()

    if (existingReferral) {
      return NextResponse.json({ error: 'You have already used a referral code' }, { status: 400 })
    }

    // Check if referring to self
    if (referralCode.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    // Create the referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referralCode.user_id,
        referred_id: user.id,
        referral_code_id: referralCode.id,
        status: 'pending',
      })
      .select(`
        *,
        referrer:users(id, name, email)
      `)
      .single()

    if (referralError) {
      return NextResponse.json({ error: referralError.message }, { status: 400 })
    }

    return NextResponse.json(referral)
  } catch (error) {
    console.error('[POST /api/referrals/apply]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/referrals/stats - Get referral stats for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get referral code
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get referrals made by user
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)

    if (referralsError) {
      return NextResponse.json({ error: referralsError.message }, { status: 400 })
    }

    // Calculate stats
    const totalReferrals = referrals?.length || 0
    const completedReferrals = referrals?.filter((r: any) => r.status === 'completed').length || 0
    const pendingReferrals = referrals?.filter((r: any) => r.status === 'pending').length || 0
    const totalEarnings = referrals?.reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0) || 0

    // Get affiliate payouts
    const { data: payouts } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      referralCode: referralCode?.code || null,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnings,
      payouts: payouts || [],
    })
  } catch (error) {
    console.error('[GET /api/referrals/stats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
