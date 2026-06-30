"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Settings = {
  id?: string
  site_name: string | null
  site_description: string | null
  contact_email: string | null
  platform_fee: number | null
  minimum_payout: number | null
  maintenance_mode: boolean | null
}

export function AdminSettingsForm({ settings }: { settings: Settings | null }) {
  const [form, setForm] = useState({
    site_name: settings?.site_name ?? "MidasAI",
    site_description: settings?.site_description ?? "",
    contact_email: settings?.contact_email ?? "",
    platform_fee: settings?.platform_fee ?? 15,
    minimum_payout: settings?.minimum_payout ?? 50,
    maintenance_mode: settings?.maintenance_mode ?? false,
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  async function save() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      setMsg("Settings saved.")
      router.refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Site</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Site name</Label>
            <Input
              value={form.site_name}
              onChange={(e) => setForm((f) => ({ ...f, site_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact email</Label>
            <Input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input
            value={form.site_description}
            onChange={(e) => setForm((f) => ({ ...f, site_description: e.target.value }))}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Commerce</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Platform fee (%)</Label>
            <Input
              type="number"
              value={form.platform_fee}
              onChange={(e) => setForm((f) => ({ ...f, platform_fee: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Minimum payout ($)</Label>
            <Input
              type="number"
              value={form.minimum_payout}
              onChange={(e) => setForm((f) => ({ ...f, minimum_payout: Number(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Maintenance mode</p>
          <p className="text-xs text-white/40">Restrict platform access for non-admins</p>
        </div>
        <Button
          type="button"
          variant={form.maintenance_mode ? "default" : "outline"}
          onClick={() => setForm((f) => ({ ...f, maintenance_mode: !f.maintenance_mode }))}
        >
          {form.maintenance_mode ? "Enabled" : "Disabled"}
        </Button>
      </div>

      {msg && <p className="text-sm text-white/60">{msg}</p>}
      <Button onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save all settings"}
      </Button>
    </div>
  )
}
