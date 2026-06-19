import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://midasai.com'
const SITE_NAME = 'MidasAI'
const DEFAULT_DESCRIPTION = 'The premier marketplace for Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, Templates, and Prompt Packs.'

export interface SEOProps {
  title: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
  noIndex?: boolean
}

export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords,
  noIndex = false,
}: SEOProps): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image ?? `${SITE_URL}/og-default.png`

  return {
    title: `${title} - ${SITE_NAME}`,
    description,
    keywords: keywords?.join(', '),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} - ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: type === 'product' ? 'website' : type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${SITE_NAME}`,
      description,
      images: [ogImage],
      creator: '@midasai',
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large' as const,
          'max-snippet': -1,
        },
  }
}

export function generateListingMetadata(listing: {
  title: string
  description: string
  type: string
  slug?: string | null
  id: string
  images?: string[] | null
  creator?: { name: string | null } | null
  price: number
  average_rating?: number
  created_at: string
  updated_at: string
}): Metadata {
  const path = listing.slug ? `/listing/${listing.slug}` : `/listing/${listing.id}`
  const image = listing.images?.[0]

  return generateMetadata({
    title: listing.title,
    description: listing.description.slice(0, 160),
    path,
    image,
    type: 'product',
    publishedTime: listing.created_at,
    modifiedTime: listing.updated_at,
    keywords: [listing.type.toLowerCase(), 'ai', 'marketplace', 'midasai'],
  })
}

export function generateCategoryMetadata(category: {
  name: string
  slug: string
  description?: string | null
}): Metadata {
  return generateMetadata({
    title: category.name,
    description: category.description ?? `Browse ${category.name} on MidasAI. Find the best AI tools and resources.`,
    path: `/categories/${category.slug}`,
    keywords: [category.name.toLowerCase(), 'ai tools', 'marketplace'],
  })
}
