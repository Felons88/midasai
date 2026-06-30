"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RefundTransactionButton({
  transactionId,
  disabled,
}: {
  transactionId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRefund() {
    if (!confirm("Issue a full refund for this transaction?")) return
    setLoading(true)
    const res = await fetch(`/api/admin/transactions/${transactionId}/refund`, {
      method: "POST",
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? "Refund failed")
      return
    }
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || loading}
      onClick={handleRefund}
      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
    >
      {loading ? "Refunding…" : "Refund"}
    </Button>
  )
}
