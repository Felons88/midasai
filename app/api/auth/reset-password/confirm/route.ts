import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth/password-reset'
import { validateBody } from '@/lib/validation/schemas'
import { z } from 'zod'

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = await validateBody(confirmResetSchema, body)
    
    const { token, password } = validatedData

    const result = await resetPassword(token, password)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to reset password' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[auth/reset-password/confirm]', error)
    
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
