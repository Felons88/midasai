import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/downloads - Record a download
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, versionId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Check if user has purchased the listing
    const { data: purchase, error: purchaseError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .eq('status', 'COMPLETED')
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'You must purchase this listing before downloading' }, { status: 403 })
    }

    // Get the latest version if not specified
    let targetVersionId = versionId
    if (!targetVersionId) {
      const { data: latestVersion } = await supabase
        .from('listing_versions')
        .select('id')
        .eq('listing_id', listingId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()
      
      targetVersionId = latestVersion?.id
    }

    // Record the download
    const { data: download, error } = await supabase
      .from('downloads')
      .insert({
        user_id: user.id,
        listing_id: listingId,
        version_id: targetVersionId,
      })
      .select(`
        *,
        version:listing_versions(version_name, file_url, file_size, file_type)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(download)
  } catch (error) {
    console.error('[POST /api/downloads]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/downloads - Get user's download history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: downloads, error } = await supabase
      .from('downloads')
      .select(`
        *,
        listing:listings(id, title, description, images, type),
        version:listing_versions(version_name, version_number, file_url, file_size, file_type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(downloads || [])
  } catch (error) {
    console.error('[GET /api/downloads]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
