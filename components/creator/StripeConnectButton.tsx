"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"

export function StripeConnectButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleConnect = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Stripe Connect is not configured")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Failed to start Stripe Connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button className="w-full transition-smooth" onClick={handleConnect} disabled={loading}>
        <DollarSign className="mr-2 h-4 w-4" />
        {loading ? "Redirecting…" : "Connect Stripe Account"}
      </Button>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  )
}
