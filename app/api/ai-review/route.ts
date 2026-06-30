import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listing } = body

    // AI Review Assistant - provides comprehensive analysis scores
    const review = {
      quality: {
        score: 0,
        summary: '',
        issues: [] as string[],
        recommendations: [] as string[]
      },
      seo: {
        score: 0,
        summary: '',
        issues: [] as string[],
        recommendations: [] as string[]
      },
      marketplace: {
        score: 0,
        summary: '',
        issues: [] as string[],
        recommendations: [] as string[]
      },
      revenuePotential: {
        score: 0,
        estimate: 0,
        summary: '',
        factors: [] as string[]
      },
      overall: {
        score: 0,
        recommendation: '',
        shouldPublish: false
      }
    }

    // Quality Analysis
    review.quality.score = calculateQualityScore(listing)
    review.quality.summary = getQualitySummary(review.quality.score)
    review.quality.issues = getQualityIssues(listing)
    review.quality.recommendations = getQualityRecommendations(listing)

    // SEO Analysis
    review.seo.score = calculateSEOScore(listing)
    review.seo.summary = getSEOSummary(review.seo.score)
    review.seo.issues = getSEOIssues(listing)
    review.seo.recommendations = getSEORecommendations(listing)

    // Marketplace Analysis
    review.marketplace.score = calculateMarketplaceScore(listing)
    review.marketplace.summary = getMarketplaceSummary(review.marketplace.score)
    review.marketplace.issues = getMarketplaceIssues(listing)
    review.marketplace.recommendations = getMarketplaceRecommendations(listing)

    // Revenue Potential Analysis
    review.revenuePotential.score = calculateRevenueScore(listing)
    review.revenuePotential.estimate = estimateRevenue(listing)
    review.revenuePotential.summary = getRevenueSummary(review.revenuePotential.score)
    review.revenuePotential.factors = getRevenueFactors(listing)

    // Overall Assessment
    review.overall.score = Math.round(
      (review.quality.score * 0.3) +
      (review.seo.score * 0.2) +
      (review.marketplace.score * 0.2) +
      (review.revenuePotential.score * 0.3)
    )
    review.overall.recommendation = getOverallRecommendation(review.overall.score)
    review.overall.shouldPublish = review.overall.score >= 70

    return NextResponse.json({
      success: true,
      review
    })
  } catch (error) {
    console.error('Error in AI review API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI review' },
      { status: 500 }
    )
  }
}

function calculateQualityScore(listing: any): number {
  let score = 50 // Base score

  // Title quality
  if (listing.title && listing.title.length >= 10 && listing.title.length <= 100) score += 10
  if (listing.title && /^[A-Z]/.test(listing.title)) score += 5

  // Description quality
  if (listing.description && listing.description.length >= 50) score += 15
  if (listing.description && listing.description.length >= 200) score += 10

  // Documentation
  if (listing.hasReadme) score += 10
  if (listing.hasLicense) score += 5

  // Code quality
  if (listing.qualityScore) score += listing.qualityScore * 0.1

  return Math.min(100, score)
}

function calculateSEOScore(listing: any): number {
  let score = 50 // Base score

  // Title SEO
  if (listing.title && listing.title.includes('Claude')) score += 10
  if (listing.title && listing.title.includes('AI')) score += 5

  // Description SEO
  if (listing.description && listing.description.length >= 150) score += 15
  if (listing.description && listing.description.includes('Claude')) score += 10

  // Tags
  if (listing.tags && listing.tags.length >= 3) score += 10
  if (listing.tags && listing.tags.length >= 5) score += 5

  // Category
  if (listing.category) score += 5

  return Math.min(100, score)
}

function calculateMarketplaceScore(listing: any): number {
  let score = 50 // Base score

  // Category relevance
  if (listing.category && ['automation', 'productivity', 'development'].includes(listing.category.toLowerCase())) {
    score += 15
  }

  // Type popularity
  if (listing.type === 'SKILL') score += 10
  if (listing.type === 'AGENT') score += 15

  // Pricing
  if (listing.price > 0 && listing.price <= 50) score += 10
  if (listing.price === 0) score += 5

  // Creator reputation
  if (listing.creatorVerified) score += 10

  return Math.min(100, score)
}

function calculateRevenueScore(listing: any): number {
  let score = 50 // Base score

  // Price point
  if (listing.price >= 10 && listing.price <= 50) score += 20
  if (listing.price >= 5 && listing.price < 10) score += 15
  if (listing.price > 50) score += 10

  // Category demand
  if (listing.category && ['automation', 'productivity', 'development'].includes(listing.category.toLowerCase())) {
    score += 15
  }

  // Type demand
  if (listing.type === 'SKILL') score += 10
  if (listing.type === 'AGENT') score += 15

  // Quality impact
  if (listing.qualityScore >= 80) score += 10

  return Math.min(100, score)
}

function estimateRevenue(listing: any): number {
  const baseRevenue = listing.price * 100 // Assume 100 sales baseline
  const qualityMultiplier = (listing.qualityScore || 50) / 50
  const categoryMultiplier = ['automation', 'productivity'].includes(listing.category?.toLowerCase()) ? 1.5 : 1
  
  return Math.round(baseRevenue * qualityMultiplier * categoryMultiplier)
}

function getQualitySummary(score: number): string {
  if (score >= 90) return 'Excellent quality - meets all standards'
  if (score >= 80) return 'Good quality - minor improvements needed'
  if (score >= 70) return 'Acceptable quality - some improvements recommended'
  if (score >= 60) return 'Fair quality - significant improvements needed'
  return 'Poor quality - major improvements required'
}

function getSEOSummary(score: number): string {
  if (score >= 90) return 'Excellent SEO - highly discoverable'
  if (score >= 80) return 'Good SEO - well optimized'
  if (score >= 70) return 'Acceptable SEO - room for improvement'
  if (score >= 60) return 'Fair SEO - optimization needed'
  return 'Poor SEO - significant optimization required'
}

function getMarketplaceSummary(score: number): string {
  if (score >= 90) return 'Excellent marketplace fit - high demand category'
  if (score >= 80) return 'Good marketplace fit - strong positioning'
  if (score >= 70) return 'Acceptable marketplace fit - moderate demand'
  if (score >= 60) return 'Fair marketplace fit - niche positioning'
  return 'Poor marketplace fit - reconsider category'
}

function getRevenueSummary(score: number): string {
  if (score >= 90) return 'High revenue potential - strong monetization opportunity'
  if (score >= 80) return 'Good revenue potential - solid monetization opportunity'
  if (score >= 70) return 'Moderate revenue potential - reasonable monetization'
  if (score >= 60) return 'Low revenue potential - limited monetization'
  return 'Very low revenue potential - reconsider pricing'
}

function getQualityIssues(listing: any): string[] {
  const issues: string[] = []
  if (!listing.title || listing.title.length < 10) issues.push('Title too short')
  if (!listing.description || listing.description.length < 50) issues.push('Description too brief')
  if (!listing.hasReadme) issues.push('Missing README documentation')
  if (!listing.hasLicense) issues.push('Missing LICENSE file')
  return issues
}

function getQualityRecommendations(listing: any): string[] {
  const recommendations: string[] = []
  if (!listing.hasReadme) recommendations.push('Add comprehensive README.md')
  if (!listing.hasLicense) recommendations.push('Add LICENSE file with clear terms')
  if (listing.description && listing.description.length < 200) recommendations.push('Expand description with use cases')
  recommendations.push('Add screenshots or demo video')
  return recommendations
}

function getSEOIssues(listing: any): string[] {
  const issues: string[] = []
  if (!listing.title || !listing.title.includes('Claude')) issues.push('Title missing Claude keyword')
  if (!listing.description || listing.description.length < 150) issues.push('Description too short for SEO')
  if (!listing.tags || listing.tags.length < 3) issues.push('Insufficient tags for discoverability')
  return issues
}

function getSEORecommendations(listing: any): string[] {
  const recommendations: string[] = []
  if (!listing.tags || listing.tags.length < 5) recommendations.push('Add more relevant tags')
  recommendations.push('Include Claude and AI keywords in title')
  recommendations.push('Write detailed description with use cases')
  recommendations.push('Add category-specific keywords')
  return recommendations
}

function getMarketplaceIssues(listing: any): string[] {
  const issues: string[] = []
  if (!listing.category) issues.push('Missing category assignment')
  if (!listing.type) issues.push('Missing type specification')
  if (listing.price > 100) issues.push('Price may be too high for this category')
  return issues
}

function getMarketplaceRecommendations(listing: any): string[] {
  const recommendations: string[] = []
  if (!listing.category) recommendations.push('Choose a high-demand category')
  recommendations.push('Consider freemium pricing model')
  recommendations.push('Add demo or trial version')
  recommendations.push('Bundle with complementary assets')
  return recommendations
}

function getRevenueFactors(listing: any): string[] {
  const factors: string[] = []
  if (listing.price > 0) factors.push(`Price point: $${listing.price}`)
  if (listing.category) factors.push(`Category demand: ${listing.category}`)
  if (listing.type) factors.push(`Type popularity: ${listing.type}`)
  if (listing.qualityScore) factors.push(`Quality score: ${listing.qualityScore}`)
  factors.push('Market demand: High for AI/automation tools')
  return factors
}

function getOverallRecommendation(score: number): string {
  if (score >= 90) return 'Excellent - Ready to publish with high confidence'
  if (score >= 80) return 'Good - Ready to publish with minor improvements'
  if (score >= 70) return 'Acceptable - Publish after addressing key issues'
  if (score >= 60) return 'Needs Work - Address issues before publishing'
  return 'Not Ready - Significant improvements required'
}
