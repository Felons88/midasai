"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROLES = ["USER", "CREATOR", "MODERATOR", "ADMIN", "OWNER"] as const

export function UserRoleEditor({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function onChange(next: string) {
    if (next === role) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setRole(next)
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={busy}>
      <SelectTrigger className="h-8 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
