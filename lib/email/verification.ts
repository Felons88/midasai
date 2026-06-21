import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from './send'
import crypto from 'crypto'

const VERIFICATION_TOKEN_LENGTH = 32
const VERIFICATION_EXPIRY_HOURS = 24

export async function generateVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(VERIFICATION_TOKEN_LENGTH).toString('hex')
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
  
  const supabase = await createClient()
  
  // Delete any existing verification tokens for this user
  await supabase
    .from('email_verifications')
    .delete()
    .eq('user_id', userId)
  
  // Insert new verification token
  await supabase
    .from('email_verifications')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    })
  
  return token
}

export async function sendVerificationEmailToUser(userId: string, email: string, name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await generateVerificationToken(userId)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const verificationUrl = `${appUrl}/verify-email?token=${token}`
    
    const result = await sendVerificationEmail(email, name, verificationUrl)
    return result
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { success: false, error: 'Failed to send verification email' }
  }
}

export async function validateVerificationToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: verification, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single()
    
    if (error || !verification) {
      return { valid: false, error: 'Invalid verification token' }
    }
    
    // Check if token has expired
    if (new Date(verification.expires_at) < new Date()) {
      return { valid: false, error: 'Verification token has expired' }
    }
    
    // Check if already verified
    if (verification.verified_at) {
      return { valid: false, error: 'Email already verified' }
    }
    
    return { valid: true, userId: verification.user_id }
  } catch (error) {
    console.error('Error validating verification token:', error)
    return { valid: false, error: 'Failed to validate token' }
  }
}

export async function markEmailAsVerified(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: verification, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single()
    
    if (error || !verification) {
      return { success: false, error: 'Invalid verification token' }
    }
    
    // Mark as verified
    await supabase
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)
    
    // Update user's email_verified status
    await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', verification.user_id)
    
    return { success: true }
  } catch (error) {
    console.error('Error marking email as verified:', error)
    return { success: false, error: 'Failed to mark email as verified' }
  }
}

export async function cleanupExpiredTokens(): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('email_verifications')
    .delete()
    .lt('expires_at', new Date().toISOString())
}
