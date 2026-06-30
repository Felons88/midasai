import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody, reviewSchema } from '@/lib/validation/schemas'

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = await validateBody(reviewSchema, body)
    
    const { listing_id, rating, title, content } = validatedData

    // Check if user has purchased the listing
    const { data: purchase, error: purchaseError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('listing_id', listing_id)
      .eq('status', 'COMPLETED')
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'You must purchase this listing before reviewing it' }, { status: 403 })
    }

    // Check if user has already reviewed this listing
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('listing_id', listing_id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 400 })
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        listing_id,
        rating,
        title,
        content,
      })
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .single()

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 400 })
    }

    // Update listing's average rating
    await updateListingRating(listing_id)

    return NextResponse.json(review)
  } catch (error) {
    console.error('[reviews] POST', error)
    
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

// GET /api/reviews - Get reviews for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(reviews || [])
  } catch (error) {
    console.error('[reviews] GET', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateListingRating(listingId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get all reviews for the listing
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('listing_id', listingId)
  
  if (!reviews || reviews.length === 0) {
    return
  }
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / reviews.length
  
  // Update the listing
  await supabase
    .from('listings')
    .update({
      average_rating: averageRating,
      review_count: reviews.length,
    })
    .eq('id', listingId)
}
