import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the listing
    const { data: existing } = await supabase
      .from('listings')
      .select('creator_id')
      .eq('id', params.id)
      .single()

    if (!existing || existing.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('listings')
      .update({ 
        status: 'ARCHIVED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[listings/[id]/archive]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
