import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/versions - Create a new listing version
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, versionName, changelog, fileUrl, fileSize, fileType } = body

    if (!listingId || !versionName || !fileUrl) {
      return NextResponse.json({ error: 'listingId, versionName, and fileUrl are required' }, { status: 400 })
    }

    // Check if user is the creator
    const { data: listing } = await supabase
      .from('listings')
      .select('creator_id')
      .eq('id', listingId)
      .single()

    if (!listing || listing.creator_id !== user.id) {
      return NextResponse.json({ error: 'You can only create versions for your own listings' }, { status: 403 })
    }

    // Get the next version number
    const { data: latestVersion } = await supabase
      .from('listing_versions')
      .select('version_number')
      .eq('listing_id', listingId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (latestVersion?.version_number || 0) + 1

    const { data, error } = await supabase
      .from('listing_versions')
      .insert({
        listing_id: listingId,
        version_number: nextVersionNumber,
        version_name: versionName,
        changelog,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[POST /api/versions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/versions - Get versions for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: versions, error } = await supabase
      .from('listing_versions')
      .select('*')
      .eq('listing_id', listingId)
      .order('version_number', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(versions || [])
  } catch (error) {
    console.error('[GET /api/versions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/versions - Delete a version
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 })
    }

    // Check if user is the creator
    const { data: version } = await supabase
      .from('listing_versions')
      .select(`
        *,
        listing:listings(creator_id)
      `)
      .eq('id', versionId)
      .single()

    if (!version || version.listing.creator_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete versions for your own listings' }, { status: 403 })
    }

    const { error } = await supabase
      .from('listing_versions')
      .delete()
      .eq('id', versionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/versions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
