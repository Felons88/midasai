"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RefreshCw, AlertTriangle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

type AnimatedErrorPageProps = {
  title?: string
  message?: string
  detail?: string
  onRetry?: () => void
  showSupport?: boolean
}

export function AnimatedErrorPage({
  title = "Something went wrong",
  message = "We encountered an unexpected error. This has been logged and our team has been notified.",
  detail,
  onRetry,
  showSupport = true,
}: AnimatedErrorPageProps) {
  useEffect(() => {
    if (detail) console.error(detail)
  }, [detail])

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center overflow-hidden">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-red-500/10 blur-3xl animate-error-float" />
        <div
          className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl animate-error-float"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute h-28 w-28 rounded-full border border-red-500/20 animate-error-ping" />
              <div className="absolute h-20 w-20 rounded-full border border-amber-500/30 animate-error-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 shadow-glow animate-error-shake">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                Error
              </p>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-4">{title}</h1>
            <p className="text-lg md:text-xl text-text-secondary mb-4">{message}</p>

            {detail && (
              <p className="text-sm text-text-tertiary font-mono bg-surface p-4 rounded-lg inline-block max-w-full break-words text-left">
                {detail}
              </p>
            )}
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {onRetry && (
              <Button onClick={onRetry} className="h-12 shadow-glow">
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
              </Button>
            )}
            <Button variant="outline" className="h-12 transition-smooth" asChild>
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" className="h-12 transition-smooth" asChild>
              <Link href="/explore">
                Explore Marketplace
              </Link>
            </Button>
          </div>

          {showSupport && (
            <div
              className="mt-12 p-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
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
          )}
        </div>
      </div>
    </div>
  )
}
