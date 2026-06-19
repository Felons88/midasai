import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationJsonLd, generateWebsiteJsonLd } from "@/lib/seo/json-ld";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://midasai.com";

export const metadata: Metadata = {
  title: {
    default: "MidasAI - The Premier AI Marketplace",
    template: "%s | MidasAI",
  },
  description:
    "Discover and share Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, Templates, and Prompt Packs. The highest quality AI marketplace on the internet.",
  keywords: [
    "AI marketplace",
    "Claude Skills",
    "Cursor Rules",
    "MCP Servers",
    "AI Agents",
    "Windsurf Workflows",
    "Prompt Packs",
    "AI Templates",
    "AI Automations",
  ],
  authors: [{ name: "MidasAI" }],
  creator: "MidasAI",
  publisher: "MidasAI",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "MidasAI - The Premier AI Marketplace",
    description:
      "Discover and share Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, Templates, and Prompt Packs.",
    url: SITE_URL,
    siteName: "MidasAI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "MidasAI - The Premier AI Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MidasAI - The Premier AI Marketplace",
    description:
      "Discover and share Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, Templates, and Prompt Packs.",
    images: [`${SITE_URL}/og-default.png`],
    creator: "@midasai",
  },
  robots: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
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
        <JsonLd data={[generateOrganizationJsonLd(), generateWebsiteJsonLd()]} />
      </head>
      <body
        className={`${poppins.variable} ${openSans.variable} font-sans antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
