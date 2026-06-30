"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface InfiniteScrollProps {
  children: React.ReactNode
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  className?: string
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  className,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { rootMargin: `${threshold}px` }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [threshold])

  useEffect(() => {
    if (isVisible && hasMore && !isLoading) {
      onLoadMore()
      setIsVisible(false)
    }
  }, [isVisible, hasMore, isLoading, onLoadMore])

  return (
    <div className={className}>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-8">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-cta" />
          ) : (
            <div className="h-6" />
          )}
        </div>
      )}
    </div>
  )
}
