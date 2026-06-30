"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ModerationResolveButton({ reportId }: { reportId: string }) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function resolve(action: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/moderation/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED", action_taken: action }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("Failed to resolve report")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => resolve("dismissed")}>
        Dismiss
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => resolve("listing_removed")}>
        Remove listing
      </Button>
    </div>
  )
}
