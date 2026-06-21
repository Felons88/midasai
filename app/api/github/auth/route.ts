import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = process.env.GITHUB_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Generate state with user_id for security
    const state = user.id
    
    const authUrl = new URL('https://github.com/login/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId!)
    authUrl.searchParams.set('redirect_uri', `${appUrl}/api/github/callback`)
    authUrl.searchParams.set('scope', 'repo user')
    authUrl.searchParams.set('state', state)
    
    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error('GitHub auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
