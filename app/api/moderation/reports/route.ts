import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/moderation/reports - Create a moderation report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, commentId, reason, description } = body

    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }

    if (!listingId && !commentId) {
      return NextResponse.json({ error: 'Either listingId or commentId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('moderation_reports')
      .insert({
        reporter_id: user.id,
        listing_id: listingId || null,
        comment_id: commentId || null,
        reason,
        description,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[POST /api/moderation/reports]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/moderation/reports - Get moderation reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('moderation_reports')
      .select(`
        *,
        reporter:users(id, name, email),
        listing:listings(id, title),
        comment:comments(id, content)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reports, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(reports || [])
  } catch (error) {
    console.error('[GET /api/moderation/reports]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/moderation/reports - Update moderation report (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, status, actionTaken } = body

    if (!reportId || !status) {
      return NextResponse.json({ error: 'reportId and status are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('moderation_reports')
      .update({
        status,
        action_taken: actionTaken,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[PATCH /api/moderation/reports]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
