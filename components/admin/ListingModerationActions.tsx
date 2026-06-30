"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ListingModerationActions({
  listingId,
  status,
}: {
  listingId: string
  status: string
}) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function act(action: "approve" | "reject") {
    const reason =
      action === "reject"
        ? window.prompt("Rejection reason (optional):") ?? "Does not meet quality guidelines"
        : undefined
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  if (status !== "PENDING") return null

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 text-emerald-400"
        disabled={busy}
        onClick={() => act("approve")}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 text-red-400"
        disabled={busy}
        onClick={() => act("reject")}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
