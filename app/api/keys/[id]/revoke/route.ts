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

    // Check if user owns the API key
    const { data: existing } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'REVOKE_API_KEY',
      resource_type: 'api_key',
      resource_id: params.id,
      details: { revoked_at: new Date().toISOString() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[keys/[id]/revoke]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
