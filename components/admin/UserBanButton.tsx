"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, ShieldCheck } from "lucide-react"

type UserBanButtonProps = {
  userId: string
  status: string | null | undefined
}

export function UserBanButton({ userId, status }: UserBanButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const isSuspended = status === "SUSPENDED"

  async function toggle() {
    setBusy(true)
    try {
      const next = isSuspended ? "ACTIVE" : "SUSPENDED"
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={isSuspended ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30"}
      onClick={toggle}
      disabled={busy}
    >
      {isSuspended ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
          Activate
        </>
      ) : (
        <>
          <Shield className="h-3.5 w-3.5 mr-1.5" />
          Suspend
        </>
      )}
    </Button>
  )
}
