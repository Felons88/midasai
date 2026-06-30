"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradeButtonProps {
  tier: "PRO" | "ENTERPRISE"
  label?: string
  variant?: "default" | "outline"
  className?: string
}

export function UpgradeButton({
  tier,
  label,
  variant = "default",
  className,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Checkout failed")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Checkout failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={handleUpgrade}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label ?? `Upgrade to ${tier}`}
      </Button>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
