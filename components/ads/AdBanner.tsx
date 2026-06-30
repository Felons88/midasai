"use client"

import { useEffect, useRef } from "react"

interface AdBannerProps {
  slot: string
  format?: "auto" | "rectangle" | "vertical" | "horizontal"
  responsive?: boolean
  className?: string
}

export function AdBanner({ slot, format = "auto", responsive = true, className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const w = window as any
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch (e) {
      // AdSense not loaded yet — ignore
    }
  }, [])

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1251283874667780"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  )
}
