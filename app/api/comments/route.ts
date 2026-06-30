import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/comments - Create a comment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, content, parentId } = body

    if (!listingId || !content) {
      return NextResponse.json({ error: 'listingId and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        parent_id: parentId || null,
        content,
      })
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[POST /api/comments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/comments - Get comments for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, name, avatar_url),
        replies:comments(
          id,
          content,
          created_at,
          updated_at,
          user:users(id, name, avatar_url)
        )
      `)
      .eq('listing_id', listingId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('[GET /api/comments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/comments - Update a comment
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commentId, content } = body

    if (!commentId || !content) {
      return NextResponse.json({ error: 'commentId and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[PATCH /api/comments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/comments - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/comments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
