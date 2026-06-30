import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export async function generateCSRFToken(): Promise<string> {
  const token = generateRandomToken(CSRF_TOKEN_LENGTH)
  
  // Store token in cookie
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_SESSION_DURATION / 1000,
    path: '/',
  })
  
  // Also store in database for server-side validation
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase.from('csrf_tokens').insert({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + CSRF_SESSION_DURATION).toISOString(),
    })
  }
  
  return token
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value
  
  if (!cookieToken || cookieToken !== token) {
    return false
  }
  
  // Validate against database
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: storedToken } = await supabase
      .from('csrf_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (!storedToken) {
      return false
    }
    
    // Clean up used token
    await supabase
      .from('csrf_tokens')
      .delete()
      .eq('id', storedToken.id)
  }
  
  return true
}

export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

function generateRandomToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function cleanupExpiredTokens(): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('csrf_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())
}
