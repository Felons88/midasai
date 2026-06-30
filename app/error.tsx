"use client"

import { AnimatedErrorPage } from "@/components/ui/AnimatedErrorPage"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AnimatedErrorPage
      detail={error.message || error.digest}
      onRetry={reset}
    />
  )
}
