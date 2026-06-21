import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateQuery } from '@/lib/validation/schemas'
import { z } from 'zod'

const authorizeSchema = z.object({
  client_id: z.string().uuid(),
  redirect_uri: z.string().url(),
  response_type: z.enum(['code']),
  scope: z.string(),
  state: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${appUrl}/login?redirect=${encodeURIComponent(request.url)}`)
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const validatedData = await validateQuery(authorizeSchema, searchParams)
    
    const { client_id, redirect_uri, response_type, scope, state } = validatedData

    // Verify the application exists and redirect URI matches
    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', client_id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
    }

    if (application.callback_url !== redirect_uri) {
      return NextResponse.json({ error: 'Invalid redirect_uri' }, { status: 400 })
    }

    // Check if user has already authorized this app
    const { data: existingAuth } = await supabase
      .from('oauth_authorizations')
      .select('*')
      .eq('user_id', user.id)
      .eq('application_id', client_id)
      .single()

    if (existingAuth) {
      // User already authorized, return consent screen
      return NextResponse.json({
        application: {
          name: application.name,
          description: application.description,
          website: application.website,
        },
        scopes: scope.split(' '),
        already_authorized: true,
      })
    }

    // Show consent screen
    return NextResponse.json({
      application: {
        name: application.name,
        description: application.description,
        website: application.website,
      },
      scopes: scope.split(' '),
      already_authorized: false,
    })
  } catch (error) {
    console.error('[oauth/authorize]', error)
    
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = await validateQuery(authorizeSchema, body)
    
    const { client_id, redirect_uri, scope, state } = validatedData

    // Generate authorization code
    const crypto = require('crypto')
    const code = crypto.randomBytes(32).toString('hex')

    // Store authorization
    await supabase.from('oauth_authorizations').upsert({
      user_id: user.id,
      application_id: client_id,
      code,
      scope,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    }, {
      onConflict: 'user_id,application_id',
    })

    // Redirect to callback URL with code
    const redirectUrl = new URL(redirect_uri)
    redirectUrl.searchParams.set('code', code)
    redirectUrl.searchParams.set('state', state)

    return NextResponse.json({ redirect_url: redirectUrl.toString() })
  } catch (error) {
    console.error('[oauth/authorize] POST', error)
    
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
