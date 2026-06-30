import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/schemas'
import { z } from 'zod'

const tokenSchema = z.object({
  grant_type: z.enum(['authorization_code', 'refresh_token']),
  code: z.string().optional(),
  refresh_token: z.string().optional(),
  client_id: z.string().uuid(),
  client_secret: z.string(),
  redirect_uri: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = await validateBody(tokenSchema, body)
    
    const { grant_type, code, refresh_token, client_id, client_secret, redirect_uri } = validatedData

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

    if (grant_type === 'authorization_code') {
      return handleAuthorizationCodeGrant(supabase, code!, redirect_uri!, application)
    } else if (grant_type === 'refresh_token') {
      return handleRefreshTokenGrant(supabase, refresh_token!, application)
    } else {
      return NextResponse.json({ error: 'Unsupported grant type' }, { status: 400 })
    }
  } catch (error) {
    console.error('[oauth/token]', error)
    
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

async function handleAuthorizationCodeGrant(
  supabase: any,
  code: string,
  redirectUri: string,
  application: any
) {
  // Find authorization record
  const { data: authorization, error } = await supabase
    .from('oauth_authorizations')
    .select('*')
    .eq('code', code)
    .eq('application_id', application.id)
    .single()

  if (error || !authorization) {
    return NextResponse.json({ error: 'Invalid authorization code' }, { status: 400 })
  }

  // Check if code has expired
  if (new Date(authorization.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Authorization code expired' }, { status: 400 })
  }

  // Generate access token and refresh token
  const crypto = require('crypto')
  const accessToken = crypto.randomBytes(32).toString('hex')
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex')

  // Store tokens
  await supabase.from('oauth_tokens').insert({
    user_id: authorization.user_id,
    application_id: application.id,
    token_hash: accessTokenHash,
    refresh_token: refreshToken,
    scope: authorization.scope,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  })

  // Delete used authorization code
  await supabase.from('oauth_authorizations').delete().eq('id', authorization.id)

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authorization.scope,
  })
}

async function handleRefreshTokenGrant(
  supabase: any,
  refreshToken: string,
  application: any
) {
  // Find token record
  const { data: token, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('refresh_token', refreshToken)
    .eq('application_id', application.id)
    .single()

  if (error || !token) {
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
}
