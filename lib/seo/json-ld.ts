const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://midasai.com'
const SITE_NAME = 'MidasAI'

export interface ListingJsonLdProps {
  id: string
  title: string
  description: string
  slug?: string | null
  type: string
  price: number
  creator?: { name: string | null; avatar_url?: string | null } | null
  average_rating?: number
  review_count?: number
  images?: string[] | null
  created_at: string
  updated_at: string
  category?: { name: string } | null
}

export function generateListingJsonLd(listing: ListingJsonLdProps): object {
  const url = `${SITE_URL}/listing/${listing.slug ?? listing.id}`

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: listing.title,
    description: listing.description,
    url,
    applicationCategory: listing.category?.name ?? listing.type,
    operatingSystem: 'Any',
    datePublished: listing.created_at,
    dateModified: listing.updated_at,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }

  if (listing.images && listing.images.length > 0) {
    jsonLd.image = listing.images[0]
    jsonLd.screenshot = listing.images
  }

  if (listing.creator?.name) {
    jsonLd.author = {
      '@type': 'Person',
      name: listing.creator.name,
      ...(listing.creator.avatar_url && { image: listing.creator.avatar_url }),
    }
  }

  if (listing.average_rating && listing.review_count && listing.review_count > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: listing.average_rating,
      ratingCount: listing.review_count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return jsonLd
}

export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'The premier marketplace for AI Skills, MCP Servers, AI Agents, Workflows, Templates, and Prompt Packs.',
    sameAs: [
      'https://twitter.com/midasai',
      'https://github.com/midasai',
    ],
  }
}

export function generateWebsiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'The premier marketplace for AI Skills, MCP Servers, AI Agents, Workflows, Templates, and Prompt Packs.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateCollectionPageJsonLd(props: {
  name: string
  description: string
  url: string
  items: { name: string; url: string }[]
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: props.name,
    description: props.description,
    url: props.url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: props.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  }
}
