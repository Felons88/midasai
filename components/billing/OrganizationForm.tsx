"use client"

import { useState } from "react"
import { Building2, Plus, Loader2, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OrganizationFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function OrganizationForm({ onSuccess, onCancel }: OrganizationFormProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"details" | "plan" | "complete">("details")

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(generateSlug(value))
  }

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create organization")
      }
      setStep("plan")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create organization")
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = async (planId: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/organizations/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to set plan")
      }
      setStep("complete")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set plan")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onSuccess()
  }

  return (
    <DialogContent className="bg-[#09090b] border-white/[0.06] max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          Create Organization
        </DialogTitle>
        <DialogDescription className="text-white/50">
          {step === "details" && "Set up your team workspace with shared credits and billing."}
          {step === "plan" && "Choose a plan for your organization."}
          {step === "complete" && "Your organization is ready!"}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={handleSubmitDetails} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Inc."
              className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-white">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-sm">midasai.app/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-inc"
                className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30"
                required
              />
            </div>
            <p className="text-xs text-white/30">
              This will be your organization's public URL. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <Plus className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {step === "plan" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handlePlanSelect("team")}
              disabled={loading}
              className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Team</span>
                <span className="text-lg font-bold text-blue-400">$59/mo</span>
              </div>
              <p className="text-xs text-white/50">Up to 10 team seats, shared credit pool, priority support</p>
            </button>
            <button
              onClick={() => handlePlanSelect("enterprise")}
              disabled={loading}
              className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Enterprise</span>
                <span className="text-lg font-bold text-purple-400">Custom</span>
              </div>
              <p className="text-xs text-white/50">Unlimited seats, custom contracts, dedicated support</p>
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => setStep("details")}
            disabled={loading}
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-4 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Organization Created!</h3>
            <p className="text-sm text-white/50">
              Your team workspace is ready. You can now invite members and start collaborating.
            </p>
          </div>
          <Button onClick={handleComplete} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      )}
    </DialogContent>
  )
}
