import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

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
    url: "https://midasai.com",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MidasAI",
              "url": "https://midasai.com",
              "description": "Discover and monetize AI resources: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, and Templates.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://midasai.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${poppins.variable} ${openSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
