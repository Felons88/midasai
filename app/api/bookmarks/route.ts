import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/bookmarks - Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })
      .select(`
        *,
        listing:listings(id, title, description, price, images, type)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[POST /api/bookmarks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/bookmarks - Get user's bookmarks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        listing:listings(id, title, description, price, images, type, average_rating, review_count, creator_id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(bookmarks || [])
  } catch (error) {
    console.error('[GET /api/bookmarks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/bookmarks - Remove a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/bookmarks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
