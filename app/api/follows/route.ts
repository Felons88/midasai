import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/follows - Follow a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { followingId } = body

    if (!followingId) {
      return NextResponse.json({ error: 'followingId is required' }, { status: 400 })
    }

    if (followingId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[POST /api/follows]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/follows - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('followingId')

    if (!followingId) {
      return NextResponse.json({ error: 'followingId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/follows]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/follows - Check if following and get follower counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    // Check if current user is following
    let isFollowing = false
    if (user) {
      const { data: follow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()
      
      isFollowing = !!follow
    }

    return NextResponse.json({
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
      isFollowing,
    })
  } catch (error) {
    console.error('[GET /api/follows]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
