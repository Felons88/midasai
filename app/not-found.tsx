import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-9xl font-bold text-cta mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Page Not Found</h2>
            <p className="text-xl text-text-secondary mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Button className="h-12 shadow-glow" asChild>
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" className="h-12 transition-smooth" asChild>
              <Link href="/explore">
                <Search className="mr-2 h-5 w-5" />
                Explore Marketplace
              </Link>
            </Button>
          </div>

          <div className="mt-12 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-text-tertiary mb-2">Looking for something specific?</p>
            <p className="text-sm text-text-secondary">
              Try searching for AI skills, plugins, or agents in our marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
