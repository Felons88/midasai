import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GitHub connection
    const { data: connection, error: connectionError } = await supabase
      .from('github_connections')
      .select('github_access_token')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    // Fetch repositories from GitHub
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${connection.github_access_token}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
    }

    const repositories = await response.json()
    
    return NextResponse.json({ repositories })
  } catch (error) {
    console.error('GitHub repos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
