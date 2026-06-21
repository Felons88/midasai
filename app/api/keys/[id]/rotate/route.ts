import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

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
      .select('user_id, name, description, permissions, rate_limit, allowed_ips, allowed_domains, restriction_type')
      .eq('id', params.id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate new API key
    const newKey = `mk_${crypto.randomBytes(32).toString('hex')}`
    const newKeyHash = crypto.createHash('sha256').update(newKey).digest('hex')

    // Update API key with new key hash
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update({ 
        key_hash: newKeyHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'ROTATE_API_KEY',
      resource_type: 'api_key',
      resource_id: params.id,
      details: { rotated_at: new Date().toISOString() },
    })

    // Return the new key (only time it's shown)
    return NextResponse.json({ 
      ...apiKey,
      key: newKey,
    })
  } catch (error) {
    console.error('[keys/[id]/rotate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
