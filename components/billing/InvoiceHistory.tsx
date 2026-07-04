"use client"

import { useState, useEffect } from "react"
import { Receipt, Download, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Invoice {
  id: string
  stripeInvoiceId: string | null
  amount: number
  currency: string
  status: string
  periodStart: string | null
  periodEnd: string | null
  description: string | null
  createdAt: string
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/invoices")
      if (!res.ok) throw new Error("Failed to load invoices")
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/download`)
      if (!res.ok) throw new Error("Failed to download invoice")
      const data = await res.json()
      if (data.url) {
        window.open(data.url, "_blank")
      }
    } catch (e) {
      console.error("Download error:", e)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-emerald-400"
      case "open":
        return "text-amber-400"
      case "draft":
        return "text-white/40"
      case "uncollectible":
        return "text-red-400"
      default:
        return "text-white/50"
    }
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

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <Receipt className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/40">No invoices yet</p>
        <p className="text-xs text-white/30">Your subscription invoices will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]"
        >
          <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Receipt className="h-5 w-5 text-white/30" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-white">
                {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
              </p>
              <span className={`text-xs font-semibold capitalize ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-white/40">
              {formatAmount(invoice.amount, invoice.currency)}
              {invoice.description && ` • ${invoice.description}`}
            </p>
          </div>
          {invoice.stripeInvoiceId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(invoice.stripeInvoiceId!)}
              className="text-white/30 hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
