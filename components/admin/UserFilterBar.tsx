"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

const ROLES = ["ALL", "USER", "CREATOR", "MODERATOR", "ADMIN", "OWNER"]
const STATUSES = ["ALL", "ACTIVE", "SUSPENDED"]

export function UserFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [role, setRole] = useState(searchParams.get("role") ?? "ALL")
  const [status, setStatus] = useState(searchParams.get("status") ?? "ALL")
  const [from, setFrom] = useState(searchParams.get("from") ?? "")
  const [to, setTo] = useState(searchParams.get("to") ?? "")

  function apply() {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (role && role !== "ALL") params.set("role", role)
    if (status && status !== "ALL") params.set("status", status)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  function clear() {
    setSearch("")
    setRole("ALL")
    setStatus("ALL")
    setFrom("")
    setTo("")
    startTransition(() => {
      router.push("?")
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <Input
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="pl-9 h-9 text-xs bg-white/[0.03] border-white/[0.06]"
        />
      </div>
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="w-[130px] h-9 text-xs bg-white/[0.03] border-white/[0.06]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r === "ALL" ? "All roles" : r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[130px] h-9 text-xs bg-white/[0.03] border-white/[0.06]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s === "ALL" ? "All statuses" : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="w-[140px] h-9 text-xs bg-white/[0.03] border-white/[0.06]"
        placeholder="From"
      />
      <Input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="w-[140px] h-9 text-xs bg-white/[0.03] border-white/[0.06]"
        placeholder="To"
      />
      <Button size="sm" className="h-9 text-xs" onClick={apply} disabled={isPending}>
        Filter
      </Button>
      <Button variant="outline" size="sm" className="h-9 text-xs" onClick={clear} disabled={isPending}>
        <X className="h-3.5 w-3.5 mr-1" />
        Clear
      </Button>
    </div>
  )
}
