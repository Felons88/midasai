import type { Metadata } from "next";
import "./globals.css";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: {
    default: "MidasAI - AI Marketplace for Claude Skills, MCP Servers & More",
    template: "%s | MidasAI"
  },
  description: "Discover and monetize AI resources: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, and Templates. The premier marketplace for AI developers.",
  keywords: ["Claude Skills", "Cursor Rules", "Windsurf Workflows", "MCP Servers", "AI Agents", "Prompt Packs", "AI Marketplace", "AI Tools", "Claude Code", "Anthropic Claude"],
  authors: [{ name: "MidasAI" }],
  creator: "MidasAI",
  publisher: "MidasAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: PRODUCTION_SITE_URL,
    title: "MidasAI - AI Marketplace for Claude Skills, MCP Servers & More",
    description: "Discover and monetize AI resources: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, and Templates.",
    siteName: "MidasAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MidasAI - AI Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MidasAI - AI Marketplace for Claude Skills, MCP Servers & More",
    description: "Discover and monetize AI resources: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, and Templates.",
    images: ["/og-image.png"],
    creator: "@midasai",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MidasAI",
              "url": PRODUCTION_SITE_URL,
              "description": "Discover and monetize AI resources: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, and Templates.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${PRODUCTION_SITE_URL}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
