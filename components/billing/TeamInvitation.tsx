"use client"

import { useState } from "react"
import { UserPlus, Mail, Loader2, AlertCircle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TeamInvitationProps {
  organizationId: string
  onSuccess: () => void
  onCancel: () => void
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
}

export function TeamInvitation({ organizationId, onSuccess, onCancel }: TeamInvitationProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"member" | "admin">("member")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)

  const loadInvitations = async () => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/invitations`)
      if (!res.ok) throw new Error("Failed to load invitations")
      const data = await res.json()
      setInvitations(data.invitations || [])
    } catch (e) {
      console.error("Error loading invitations:", e)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }
      setEmail("")
      setShowInviteForm(false)
      await loadInvitations()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/invitations/${invitationId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to cancel invitation")
      await loadInvitations()
    } catch (e) {
      console.error("Error cancelling invitation:", e)
    }
  }

  const handleResendInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/invitations/${invitationId}/resend`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to resend invitation")
    } catch (e) {
      console.error("Error resending invitation:", e)
    }
  }

  return (
    <DialogContent className="bg-[#09090b] border-white/[0.06] max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-400" />
          Team Members
        </DialogTitle>
        <DialogDescription className="text-white/50">
          Invite team members to collaborate on your organization.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!showInviteForm ? (
        <Button
          onClick={() => setShowInviteForm(true)}
          className="w-full"
          variant="outline"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Team Member
        </Button>
      ) : (
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-white">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              className="w-full h-10 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInviteForm(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {invitations.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold text-white">Pending Invitations</h4>
          {invitations.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]"
            >
              <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <Mail className="h-4 w-4 text-white/30" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{invite.email}</p>
                <p className="text-xs text-white/40 capitalize">{invite.role} • {invite.status}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleResendInvite(invite.id)}
                  className="text-white/30 hover:text-white"
                >
                  <Loader2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCancelInvite(invite.id)}
                  className="text-white/30 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Close
        </Button>
        <Button onClick={onSuccess} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Done
        </Button>
      </div>
    </DialogContent>
  )
}
