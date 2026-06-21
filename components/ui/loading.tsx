import { Loader2 } from "lucide-react"

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`animate-spin text-cta ${sizeClasses[size]}`} />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="glass rounded-xl p-6 animate-pulse">
      <div className="aspect-video bg-surface rounded-xl mb-4" />
      <div className="h-6 bg-surface rounded mb-2 w-3/4" />
      <div className="h-4 bg-surface rounded mb-4 w-full" />
      <div className="h-8 bg-surface rounded w-1/3" />
    </div>
  )
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}
