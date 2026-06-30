import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get creator's listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .eq('creator_id', user.id)

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        totalSales: 0,
        totalDownloads: 0,
        averageRating: 0,
        salesByDate: [],
        revenueByListing: [],
        topListings: [],
      })
    }

    const listingIds = listings.map(l => l.id)

    // Build date filter
    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `and created_at.gte.${startDate},created_at.lte.${endDate}`
    }

    // Get total revenue and sales
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, listing_id, created_at')
      .in('listing_id', listingIds)
      .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalSales = transactions?.length || 0

    // Get total downloads
    const { data: downloads } = await supabase
      .from('usage_records')
      .select('id')
      .in('listing_id', listingIds)

    const totalDownloads = downloads?.length || 0

    // Get average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('listing_id', listingIds)

    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Group sales by date
    const salesByDate = transactions?.reduce((acc: any, t) => {
      const date = new Date(t.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {}) || {}

    const salesByDateArray = Object.entries(salesByDate).map(([date, count]) => ({
      date,
      sales: count,
    }))

    // Group revenue by listing
    const revenueByListing = transactions?.reduce((acc: any, t) => {
      acc[t.listing_id] = (acc[t.listing_id] || 0) + (t.amount || 0)
      return acc
    }, {}) || {}

    const revenueByListingArray = await Promise.all(
      Object.entries(revenueByListing).map(async ([listingId, revenue]) => {
        const { data: listing } = await supabase
          .from('listings')
          .select('id, title')
          .eq('id', listingId)
          .single()
        return {
          listingId,
          title: listing?.title || 'Unknown',
          revenue,
        }
      })
    )

    // Get top listings by sales
    const topListings = await Promise.all(
      listingIds.map(async (id) => {
        const { data: listing } = await supabase
          .from('listings')
          .select('id, title, downloads, average_rating')
          .eq('id', id)
          .single()
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('listing_id', id)
        return {
          ...listing,
          sales: count || 0,
        }
      })
    )

    topListings.sort((a, b) => b.sales - a.sales)

    return NextResponse.json({
      totalRevenue,
      totalSales,
      totalDownloads,
      averageRating,
      salesByDate: salesByDateArray,
      revenueByListing: revenueByListingArray,
      topListings: topListings.slice(0, 5),
    })
  } catch (error) {
    console.error('[analytics/creator]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
