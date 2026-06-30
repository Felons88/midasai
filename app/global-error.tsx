"use client"

import { AnimatedErrorPage } from "@/components/ui/AnimatedErrorPage"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased">
        <AnimatedErrorPage
          title="Application error"
          message="A critical error occurred. Please try again or return home."
          detail={error.message || error.digest}
          onRetry={reset}
        />
      </body>
    </html>
  )
}
