import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export type ReviewVerificationType = "purchase" | "download"

const LABELS: Record<ReviewVerificationType, string> = {
  purchase: "Verified Purchase",
  download: "Verified Download",
}

interface VerifiedReviewBadgeProps {
  type: ReviewVerificationType
  className?: string
}

export function VerifiedReviewBadge({ type, className }: VerifiedReviewBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3" aria-hidden />
      {LABELS[type]}
    </span>
  )
}
