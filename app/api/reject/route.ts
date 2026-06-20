import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, reason, feedback, qualityScore } = body

    const supabase = await createClient()

    // Update listing status to REJECTED
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        status: 'REJECTED',
        rejection_reason: reason,
        rejection_feedback: feedback,
        quality_score: qualityScore
      })
      .eq('id', listingId)

    if (updateError) {
      console.error('Error updating listing status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to reject listing' },
        { status: 500 }
      )
    }

    // Create notification for the creator
    const { data: listing } = await supabase
      .from('listings')
      .select('creator_id, title')
      .eq('id', listingId)
      .single()

    if (listing) {
      await supabase.from('notifications').insert({
        user_id: listing.creator_id,
        title: 'Listing Rejected',
        message: `Your listing "${listing.title}" was rejected. ${reason}`,
        type: 'REJECTION',
        read: false
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Listing rejected and notification sent'
    })
  } catch (error) {
    console.error('Error in reject API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reject listing' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get rejection details
    const { data: listing, error } = await supabase
      .from('listings')
      .select('rejection_reason, rejection_feedback, quality_score')
      .eq('id', listingId)
      .single()

    if (error) {
      console.error('Error fetching rejection details:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rejection details' },
        { status: 500 }
      )
    }

    // Generate actionable feedback based on rejection reason
    const actionableFeedback = generateActionableFeedback(
      listing?.rejection_reason,
      listing?.quality_score
    )

    return NextResponse.json({
      success: true,
      rejection: listing,
      actionableFeedback
    })
  } catch (error) {
    console.error('Error in reject API GET:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rejection details' },
      { status: 500 }
    )
  }
}

function generateActionableFeedback(reason: string | null, qualityScore: number | null) {
  const feedback: string[] = []

  if (reason?.includes('documentation') || reason?.includes('readme')) {
    feedback.push('Add a comprehensive README.md with:')
    feedback.push('  - Installation instructions')
    feedback.push('  - Usage examples')
    feedback.push('  - API documentation if applicable')
    feedback.push('  - Troubleshooting section')
  }

  if (reason?.includes('quality') || (qualityScore && qualityScore < 70)) {
    feedback.push('Improve code quality by:')
    feedback.push('  - Running linter and fixing errors')
    feedback.push('  - Adding type annotations')
    feedback.push('  - Writing unit tests')
    feedback.push('  - Following best practices')
  }

  if (reason?.includes('structure') || reason?.includes('organization')) {
    feedback.push('Improve project structure:')
    feedback.push('  - Add package.json with proper metadata')
    feedback.push('  - Include configuration files (.eslintrc, tsconfig.json)')
    feedback.push('  - Organize files logically')
    feedback.push('  - Add .gitignore file')
  }

  if (reason?.includes('license') || reason?.includes('legal')) {
    feedback.push('Add proper licensing:')
    feedback.push('  - Choose an appropriate open-source license (MIT, Apache 2.0, GPL)')
    feedback.push('  - Include LICENSE file in root directory')
    feedback.push('  - Specify usage terms clearly')
  }

  if (reason?.includes('description') || reason?.includes('metadata')) {
    feedback.push('Enhance listing metadata:')
    feedback.push('  - Write clear, descriptive title')
    feedback.push('  - Provide detailed description')
    feedback.push('  - Add relevant tags')
    feedback.push('  - Include screenshots or demo')
  }

  if (feedback.length === 0) {
    feedback.push('Review the rejection reason and make necessary improvements')
    feedback.push('Contact support if you need clarification')
  }

  return feedback
}
