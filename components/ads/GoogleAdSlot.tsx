"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  getAdSenseClientId,
  getAdSlotId,
  isAdExcludedRoute,
  type AdPlacement,
} from "@/lib/ads/config"

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

type GoogleAdSlotProps = {
  placement: AdPlacement
  className?: string
  label?: string
}

export function GoogleAdSlot({ placement, className, label = "Advertisement" }: GoogleAdSlotProps) {
  const pathname = usePathname()
  const pushed = useRef(false)
  const clientId = getAdSenseClientId()
  const slotId = getAdSlotId(placement)

  useEffect(() => {
    if (!clientId || !slotId || isAdExcludedRoute(pathname) || pushed.current) return
    pushed.current = true
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      // Ad blockers or script not loaded yet
    }
  }, [clientId, slotId, pathname])

  // Require both a client ID and a slot ID — slotless <ins> tags never fill
  if (!clientId || !slotId || isAdExcludedRoute(pathname)) return null

  return (
    <aside
      className={cn(
        "w-full overflow-hidden rounded-xl border border-white/5 bg-surface/30",
        className
      )}
      aria-label={label}
    >
      <p className="px-3 pt-2 text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <div className="px-2 pb-2 min-h-[90px] flex items-center justify-center">
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  )
}
