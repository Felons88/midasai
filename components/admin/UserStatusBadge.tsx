"use client"

import { cn } from "@/lib/utils"

type UserStatusBadgeProps = {
  status: string | null | undefined
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const isActive = status === "ACTIVE"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        isActive
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-rose-500/15 text-rose-400"
      )}
    >
      {status ?? "ACTIVE"}
    </span>
  )
}
