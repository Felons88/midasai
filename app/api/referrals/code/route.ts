import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/referrals/code - Generate a referral code for the user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a referral code
    const { data: existingCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingCode) {
      return NextResponse.json(existingCode)
    }

    // Generate a unique referral code
    const code = await generateUniqueReferralCode(supabase)

    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[POST /api/referrals/code]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/referrals/code - Get user's referral code
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: code, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(code || null)
  } catch (error) {
    console.error('[GET /api/referrals/code]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateUniqueReferralCode(supabase: any): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code: string
  let attempts = 0
  const maxAttempts = 10

  do {
    code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('code', code)
      .single()

    if (!existing) {
      return code
    }

    attempts++
  } while (attempts < maxAttempts)

  // Fallback to timestamp-based code
  return `REF${Date.now().toString(36).toUpperCase()}`
}
