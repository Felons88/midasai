"use client"

import { useState, useEffect } from "react"
import { CreditCard, Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentMethod {
  id: string
  type: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export function SavedPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/payment-methods")
      if (!res.ok) throw new Error("Failed to load payment methods")
      const data = await res.json()
      setMethods(data.methods || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/billing/payment-methods/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete payment method")
      await loadPaymentMethods()
    } catch (e) {
      console.error("Delete error:", e)
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/billing/payment-methods/${id}/default`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to set default")
      await loadPaymentMethods()
    } catch (e) {
      console.error("Set default error:", e)
    }
  }

  const getBrandIcon = (brand: string) => {
    return <CreditCard className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <CreditCard className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/40">No saved payment methods</p>
        <p className="text-xs text-white/30">Add a card to enable one-click purchases</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <div
          key={method.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]"
        >
          <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
            {getBrandIcon(method.brand)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white capitalize">{method.brand}</p>
              {method.isDefault && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-white/40">
              •••• {method.last4} • Expires {method.expMonth}/{method.expYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!method.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetDefault(method.id)}
                className="text-xs text-white/40 hover:text-white"
              >
                Set Default
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(method.id)}
              disabled={deleting === method.id}
              className="text-white/30 hover:text-red-400 hover:bg-red-500/10"
            >
              {deleting === method.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
