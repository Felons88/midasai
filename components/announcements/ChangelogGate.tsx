"use client"

import { useEffect, useState } from "react"
import { ChangelogPopup } from "@/components/announcements/ChangelogPopup"
import type { PendingChangelog } from "@/lib/announcements/types"

export function ChangelogGate() {
  const [announcement, setAnnouncement] = useState<PendingChangelog | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/announcements/pending", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.announcement) {
          setAnnouncement(data.announcement)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded || !announcement) return null
  return <ChangelogPopup announcement={announcement} />
}
