"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, RefreshCw, AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-6">
              <AlertTriangle className="h-12 w-12 text-red-400" />
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Something went wrong</h1>
            </div>
            <p className="text-xl text-text-secondary mb-4">
              We encountered an unexpected error. This has been logged and our team has been notified.
            </p>
            {error.message && (
              <p className="text-sm text-text-tertiary font-mono bg-surface p-4 rounded-lg inline-block">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Button
              onClick={reset}
              className="h-12 shadow-glow"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            <Button variant="outline" className="h-12 transition-smooth" asChild>
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="mt-12 p-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-amber-400 mb-2">Still experiencing issues?</p>
            <p className="text-sm text-amber-400/70">
              Please contact our support team if this problem persists.
            </p>
            <Link
              href="/contact"
              className="inline-block mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
