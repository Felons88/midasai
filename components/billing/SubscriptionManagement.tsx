"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownRight, X, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { PlanTier } from "@/lib/billing/plans"

interface SubscriptionManagementProps {
  currentTier: PlanTier
  subscriptionId: string | null
  cancelAtPeriodEnd: boolean | null
  periodEnd: string | null
  onRefresh: () => void
}

const TIER_ORDER: PlanTier[] = ["FREE", "PRO", "TEAM", "ENTERPRISE"]

export function SubscriptionManagement({
  currentTier,
  subscriptionId,
  cancelAtPeriodEnd,
  periodEnd,
  onRefresh,
}: SubscriptionManagementProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    if (!subscriptionId) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to cancel subscription")
      }
      
      setShowCancelDialog(false)
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel subscription")
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    if (!subscriptionId) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/subscription/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to resume subscription")
      }
      
      setShowResumeDialog(false)
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resume subscription")
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (targetTier: PlanTier) => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier, interval: "monthly" }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Checkout failed")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upgrade failed")
    } finally {
      setLoading(false)
    }
  }

  const canCancel = currentTier !== "FREE" && subscriptionId && !cancelAtPeriodEnd
  const canResume = currentTier !== "FREE" && subscriptionId && cancelAtPeriodEnd
  const nextTier = TIER_ORDER[TIER_ORDER.indexOf(currentTier) + 1]

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Subscription Actions</h3>
        
        <div className="space-y-3">
          {nextTier && nextTier !== "ENTERPRISE" && (
            <Button
              onClick={() => handleUpgrade(nextTier)}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade to {nextTier.charAt(0) + nextTier.slice(1).toLowerCase()}
            </Button>
          )}
          
          {currentTier === "PRO" && (
            <Button
              onClick={() => handleUpgrade("TEAM")}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade to Team
            </Button>
          )}

          {canCancel && (
            <Button
              onClick={() => setShowCancelDialog(true)}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          )}

          {canResume && (
            <Button
              onClick={() => setShowResumeDialog(true)}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Resume Subscription
            </Button>
          )}
        </div>

        {cancelAtPeriodEnd && periodEnd && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400">
              Your subscription will cancel on {new Date(periodEnd).toLocaleDateString()}. 
              Resume before this date to keep your benefits.
            </p>
          </div>
        )}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#09090b] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel Subscription?</DialogTitle>
            <DialogDescription className="text-white/50">
              Your subscription will remain active until the end of your current billing period ({periodEnd ? new Date(periodEnd).toLocaleDateString() : 'end of period'}). After that, you'll lose access to premium features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={loading}
              className="flex-1"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="bg-[#09090b] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Resume Subscription</DialogTitle>
            <DialogDescription className="text-white/50">
              Your subscription will be reactivated immediately. You'll continue to be billed at your current rate.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResumeDialog(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResume}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resuming...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
