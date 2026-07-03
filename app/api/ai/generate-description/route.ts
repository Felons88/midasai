import { NextRequest, NextResponse } from 'next/server'
import { generateListingDescription } from '@/lib/ai/gemini'
import { validateBody } from '@/lib/validation/schemas'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/subscriptions'
import { runWithAIReservation } from '@/lib/billing/ai-reservation'
import { z } from 'zod'

const generateDescriptionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['SKILL', 'WORKFLOW', 'TEMPLATE', 'PLUGIN']),
  features: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user's plan allows AI upload
    const { data: entitlements } = await supabase
      .from('feature_entitlements')
      .select('tier, can_use_ai_upload')
      .eq('user_id', user.id)
      .single()
    
    const aiAccess = checkFeatureAccess('canUseAiUpload', entitlements?.tier)
    if (!aiAccess.allowed) {
      return NextResponse.json({ 
        error: 'AI description generation requires a paid plan. Upgrade to STARTER or higher to use this feature.',
        requiredTier: aiAccess.requiredTier
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = await validateBody(generateDescriptionSchema, body)
    
    const { title, type, features } = validatedData

    const aiResult = await runWithAIReservation(
      { supabase, userId: user.id },
      {
        featureKey: "generate_description",
        operationId: `gen-desc-${user.id}-${Date.now()}`,
        provider: "gemini",
      },
      async () => {
        const result = await generateListingDescription(title, type, features)
        if (!result.success) throw new Error(result.error || "Failed to generate description")
        return result.content
      }
    )

    if (aiResult.error) {
      return NextResponse.json(
        {
          error: aiResult.error,
          credits: {
            reserved: aiResult.creditsReserved,
            charged: aiResult.creditsCharged,
            refunded: aiResult.creditsRefunded,
            balance: aiResult.availableBalance,
          },
        },
        { status: aiResult.error.includes("Insufficient credits") ? 402 : 500 }
      )
    }

    return NextResponse.json({
      description: aiResult.result,
      credits: {
        reserved: aiResult.creditsReserved,
        charged: aiResult.creditsCharged,
        refunded: aiResult.creditsRefunded,
        balance: aiResult.availableBalance,
      },
    })
  } catch (error) {
    console.error('[ai/generate-description]', error)
    
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
