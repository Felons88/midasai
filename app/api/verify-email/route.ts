import { NextRequest, NextResponse } from 'next/server'
import { validateVerificationToken, markEmailAsVerified } from '@/lib/email/verification'
import { validateBody } from '@/lib/validation/schemas'
import { z } from 'zod'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = await validateBody(verifyEmailSchema, body)
    
    const { token } = validatedData
    
    // Validate token
    const validation = await validateVerificationToken(token)
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error || 'Invalid token' 
      }, { status: 400 })
    }
    
    // Mark email as verified
    const result = await markEmailAsVerified(token)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to verify email' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[verify-email]', error)
    
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
