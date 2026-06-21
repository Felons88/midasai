import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/schemas'
import { z } from 'zod'

const refreshSchema = z.object({
  refresh_token: z.string(),
  client_id: z.string().uuid(),
  client_secret: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = await validateBody(refreshSchema, body)
    
    const { refresh_token, client_id, client_secret } = validatedData

    const supabase = await createClient()

    // Verify application credentials
    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', client_id)
      .eq('client_secret', client_secret)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Invalid client credentials' }, { status: 401 })
    }

    // Find token record
    const { data: token, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('refresh_token', refresh_token)
      .eq('application_id', application.id)
      .single()

    if (tokenError || !token) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Generate new access token
    const crypto = require('crypto')
    const newAccessToken = crypto.randomBytes(32).toString('hex')
    const newRefreshToken = crypto.randomBytes(32).toString('hex')
    const newAccessTokenHash = crypto.createHash('sha256').update(newAccessToken).digest('hex')

    // Update tokens
    await supabase
      .from('oauth_tokens')
      .update({
        token_hash: newAccessTokenHash,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .eq('id', token.id)

    return NextResponse.json({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: token.scope,
    })
  } catch (error) {
    console.error('[oauth/refresh]', error)
    
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
