import { createClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email/send'
import crypto from 'crypto'

const RESET_TOKEN_LENGTH = 32
const RESET_EXPIRY_HOURS = 1

export async function generateResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(RESET_TOKEN_LENGTH).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
  
  const supabase = await createClient()
  
  // Delete any existing reset tokens for this email
  await supabase
    .from('password_resets')
    .delete()
    .eq('email', email)
  
  // Insert new reset token
  await supabase
    .from('password_resets')
    .insert({
      email,
      token,
      expires_at: expiresAt,
    })
  
  return token
}

export async function sendPasswordResetEmailToUser(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await generateResetToken(email)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${token}`
    
    const result = await sendPasswordResetEmail(email, name, resetUrl)
    return result
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error: 'Failed to send password reset email' }
  }
}

export async function validateResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: reset, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .single()
    
    if (error || !reset) {
      return { valid: false, error: 'Invalid reset token' }
    }
    
    // Check if token has expired
    if (new Date(reset.expires_at) < new Date()) {
      return { valid: false, error: 'Reset token has expired' }
    }
    
    return { valid: true, email: reset.email }
  } catch (error) {
    console.error('Error validating reset token:', error)
    return { valid: false, error: 'Failed to validate token' }
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = await validateResetToken(token)
    
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid token' }
    }
    
    const supabase = await createClient()
    
    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      return { success: false, error: 'Failed to find user' }
    }
    
    const user = users.find(u => u.email === validation.email)
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Update user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )
    
    if (updateError) {
      return { success: false, error: 'Failed to update password' }
    }
    
    // Delete used reset token
    await supabase
      .from('password_resets')
      .delete()
      .eq('token', token)
    
    return { success: true }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { success: false, error: 'Failed to reset password' }
  }
}

export async function cleanupExpiredTokens(): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('password_resets')
    .delete()
    .lt('expires_at', new Date().toISOString())
}
