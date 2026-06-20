import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthenticatedNavbar } from "@/components/layout/AuthenticatedNavbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

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
  title: "MidasAI - AI Marketplace",
  description: "Marketplace for Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, and more",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${poppins.variable} ${openSans.variable} font-sans antialiased`}>
        {user ? (
          <AuthenticatedNavbar
            userName={user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User"}
            userAvatar={user.user_metadata?.avatar_url || undefined}
            userRole={user.user_metadata?.role || "USER"}
          />
        ) : (
          <Navbar />
        )}
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
