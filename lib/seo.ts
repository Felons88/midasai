import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  price?: number
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    image = '/og-default.png',
    url = 'https://midasai.com',
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    tags,
    price,
    availability
  } = config

  const fullTitle = `${title} | MidasAI`
  const fullUrl = url.startsWith('http') ? url : `https://midasai.com${url}`

  const metadata: Metadata = {
    title: fullTitle,
    description,
    openGraph: {
      type,
      url: fullUrl,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: 'MidasAI',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  }

  // Add article specific metadata
  if (type === 'article' && publishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article' as const,
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined,
    }
  }

  // Add product specific metadata (using custom property)
  if (price !== undefined) {
    metadata.other = {
      product: JSON.stringify({
        price: price.toString(),
        currency: 'USD',
        availability: availability || 'InStock',
      }),
    } as any
  }

  // Add structured data
  const structuredData = generateStructuredData(config)
  if (structuredData) {
    metadata.other = {
      ...metadata.other,
      'application/ld+json': JSON.stringify(structuredData),
    } as any
  }

  return metadata
}

function generateStructuredData(config: SEOConfig) {
  const { title, description, url, type, publishedTime, author, tags, price, availability } = config

  const baseData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: title,
    description,
    url,
  }

  if (price !== undefined) {
    baseData['@type'] = 'Product'
    baseData.offers = {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: 'USD',
      availability: `https://schema.org/${availability || 'InStock'}`,
    }
    baseData.keywords = tags?.join(', ')
  }

  if (type === 'article' && publishedTime) {
    baseData['@type'] = 'Article'
    baseData.datePublished = publishedTime
    baseData.dateModified = publishedTime
    if (author) {
      baseData.author = {
        '@type': 'Person',
        name: author,
      }
    }
  }

  return baseData
}

export function generateListingSEO(listing: {
  title: string
  description: string
  type: string
  category: string
  price: number
  creator: string
  tags: string[]
  slug: string
}) {
  const title = listing.title
  const description = listing.description
  const url = `/listing/${listing.slug}`
  const type = 'website'
  const price = listing.price
  const availability = 'InStock'
  const tags = listing.tags

  return generateMetadata({
    title,
    description,
    url,
    type,
    price,
    availability,
    tags,
  })
}

export function generateCategorySEO(category: {
  name: string
  description: string
  slug: string
}) {
  const title = `${category.name} - Claude Skills, Cursor Rules, MCP Servers & More`
  const description = category.description
  const url = `/category/${category.slug}`
  const type = 'website'

  return generateMetadata({
    title,
    description,
    url,
    type,
  })
}

export function generateCreatorSEO(creator: {
  name: string
  bio?: string
  verified?: boolean
  slug: string
}) {
  const title = `${creator.name} - Creator Profile`
  const description = creator.bio || `View all listings by ${creator.name} on MidasAI`
  const url = `/creator/${creator.slug}`
  const type = 'website'

  return generateMetadata({
    title,
    description,
    url,
    type,
  })
}
