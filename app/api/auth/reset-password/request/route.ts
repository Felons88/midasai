import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPasswordResetEmailToUser } from '@/lib/auth/password-reset'
import { validateBody } from '@/lib/validation/schemas'
import { z } from 'zod'

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = await validateBody(requestResetSchema, body)
    
    const { email } = validatedData

    const supabase = await createClient()
    
    // Check if user exists
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
    }
    
    const existingUser = data.users.find((u: any) => u.email === email)
    
    if (!existingUser) {
      // Don't reveal that user doesn't exist for security
      return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent' })
    }
    
    // Send password reset email
    const result = await sendPasswordResetEmailToUser(email, existingUser.user_metadata?.name || 'User')
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send reset email' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent' })
  } catch (error) {
    console.error('[auth/reset-password/request]', error)
    
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
