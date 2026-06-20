import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listing_id } = await request.json()

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listing_id)
      .single()

    if (existing) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existing.id)

      return NextResponse.json({ bookmarked: false })
    }

    await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, listing_id })

    return NextResponse.json({ bookmarked: true })
  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 })
  }
}
