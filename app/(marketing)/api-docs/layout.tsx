import type { Metadata } from "next"
import { getDocsUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: {
    default: "API Documentation",
    template: "%s · MidasAI API Docs",
  },
  description:
    "Official MidasAI REST API documentation. Authentication, endpoints, webhooks, rate limits, and code examples for the AI marketplace platform.",
  metadataBase: new URL(getDocsUrl()),
  alternates: {
    canonical: getDocsUrl(),
  },
  openGraph: {
    title: "MidasAI API Documentation",
    description: "Build on the MidasAI marketplace with our REST API.",
    url: getDocsUrl(),
    siteName: "MidasAI",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
