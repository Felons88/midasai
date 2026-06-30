import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody, apiKeySchema } from '@/lib/validation/schemas'
import { getPlanLimits, canCreateResource } from '@/lib/subscriptions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('[keys/[id]] GET', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

    const body = await request.json()
    const validatedData = await validateBody(apiKeySchema.partial(), body)

    // Check rate limit against plan
    if (validatedData.rate_limit) {
      const { data: entitlements } = await supabase
        .from('feature_entitlements')
        .select('api_rate_limit')
        .eq('user_id', user.id)
        .single()
      
      const planLimit = entitlements?.api_rate_limit || 100
      if (validatedData.rate_limit > planLimit) {
        return NextResponse.json({ 
          error: `Rate limit exceeds your plan maximum of ${planLimit} requests/hour` 
        }, { status: 400 })
      }
    }

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('[keys/[id]] PATCH', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.startsWith('[')) {
      const validationErrors = JSON.parse(error.message)
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[keys/[id]] DELETE', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
