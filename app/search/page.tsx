import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SearchContainer } from './search-container'

export const metadata: Metadata = {
  title: 'Search - MidasAI',
  description: 'Search for Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, and more on MidasAI.',
  openGraph: {
    title: 'Search - MidasAI',
    description: 'Search for Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, and more on MidasAI.',
    type: 'website',
    url: 'https://midasai.com/search',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search - MidasAI',
    description: 'Search for Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, and more on MidasAI.',
  },
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContainer initialQuery={query} searchParams={params} />
      </Suspense>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-12 bg-muted/50 rounded-lg animate-pulse mb-8" />
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted/50 rounded-md animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
