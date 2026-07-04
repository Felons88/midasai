"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, CalendarClock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NexusWorkflow } from "@/lib/nexus/types"

interface Schedule {
  id: string
  workflow_id: string
  cron_expr: string
  timezone: string
  enabled: boolean
  next_run_at: string | null
  last_run_at: string | null
  created_at: string
  nexus_workflows: { name: string } | null
}

interface ScheduleManagerProps {
  workflows: NexusWorkflow[]
}

const CRON_PRESETS = [
  { label: "Every minute",     value: "* * * * *" },
  { label: "Every 5 minutes",  value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour",       value: "0 * * * *" },
  { label: "Every day at 9am", value: "0 9 * * *" },
  { label: "Every weekday 9am",value: "0 9 * * 1-5" },
  { label: "Every Monday 8am", value: "0 8 * * 1" },
  { label: "1st of month",     value: "0 0 1 * *" },
]

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo",
  "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
]

function fmt(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function ScheduleManager({ workflows }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    workflow_id: "",
    cron_expr: "0 9 * * *",
    timezone: "UTC",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/nexus/schedules")
      if (res.ok) {
        const data = await res.json() as { schedules: Schedule[] }
        setSchedules(data.schedules)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.workflow_id || !form.cron_expr) { setError("Workflow and cron expression are required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/nexus/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json() as { error: string }; throw new Error(d.error) }
      const data = await res.json() as { schedule: Schedule }
      setSchedules(prev => [data.schedule, ...prev])
      setShowForm(false)
      setForm({ workflow_id: "", cron_expr: "0 9 * * *", timezone: "UTC" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create schedule")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (s: Schedule) => {
    setToggling(s.id)
    try {
      const res = await fetch(`/api/nexus/schedules/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !s.enabled }),
      })
      if (res.ok) {
        const data = await res.json() as { schedule: Schedule }
        setSchedules(prev => prev.map(x => x.id === s.id ? data.schedule : x))
      }
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/nexus/schedules/${id}`, { method: "DELETE" })
      setSchedules(prev => prev.filter(s => s.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Scheduled Triggers</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20">
            {schedules.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Schedule
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <p className="text-xs font-medium text-white/60">New Schedule</p>

          <div>
            <label className="block text-[10px] text-white/40 mb-1">Workflow <span className="text-red-400">*</span></label>
            <select
              value={form.workflow_id}
              onChange={e => setForm(p => ({ ...p, workflow_id: e.target.value }))}
              className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white outline-none focus:border-violet-500/60"
            >
              <option value="">Select workflow…</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-white/40 mb-1">Cron Expression <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.cron_expr}
                onChange={e => setForm(p => ({ ...p, cron_expr: e.target.value }))}
                placeholder="0 9 * * *"
                className="flex-1 h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white font-mono outline-none focus:border-violet-500/60"
              />
              <select
                onChange={e => { if (e.target.value) setForm(p => ({ ...p, cron_expr: e.target.value })) }}
                className="h-8 px-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 outline-none"
                defaultValue=""
              >
                <option value="">Presets</option>
                {CRON_PRESETS.map(p => (
                  <option key={p.value} value={p.value}>{p.label} — {p.value}</option>
                ))}
              </select>
            </div>
            <p className="text-[9px] text-white/25 mt-1 font-mono">min hour day month weekday — e.g. <span className="text-white/40">0 9 * * 1-5</span> = weekdays 9am</p>
          </div>

          <div>
            <label className="block text-[10px] text-white/40 mb-1">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
              className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white outline-none focus:border-violet-500/60"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="flex-1 h-8 rounded-lg text-xs text-white/40 hover:text-white/60 border border-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {saving ? "Creating…" : "Create Schedule"}
            </button>
          </div>
        </form>
      )}

      {/* Schedule list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.06] py-12 text-center">
          <Clock className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No schedules yet</p>
          <p className="text-xs text-white/20 mt-1">Create one to run workflows automatically</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div
              key={s.id}
              className={cn(
                "rounded-xl border transition-colors",
                s.enabled
                  ? "border-white/[0.08] bg-white/[0.02]"
                  : "border-white/[0.04] bg-white/[0.01] opacity-60"
              )}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white truncate">
                      {s.nexus_workflows?.name ?? "Unknown workflow"}
                    </span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-medium",
                      s.enabled
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                        : "bg-white/[0.05] text-white/30 border border-white/[0.08]"
                    )}>
                      {s.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-white/40 font-mono">{s.cron_expr}</span>
                    <span className="text-[10px] text-white/25">{s.timezone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedId(p => p === s.id ? null : s.id)}
                    className="h-6 w-6 flex items-center justify-center rounded text-white/25 hover:text-white/60 transition-colors"
                  >
                    {expandedId === s.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleToggle(s)}
                    disabled={toggling === s.id}
                    className="h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-colors disabled:opacity-50"
                    title={s.enabled ? "Pause" : "Resume"}
                  >
                    {toggling === s.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : s.enabled
                        ? <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                        : <ToggleLeft className="h-3.5 w-3.5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="h-6 w-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {expandedId === s.id && (
                <div className="border-t border-white/[0.05] px-3 py-2 grid grid-cols-2 gap-x-6 gap-y-1">
                  <div>
                    <p className="text-[9px] text-white/25 uppercase tracking-wide">Next Run</p>
                    <p className="text-[10px] text-white/50">{fmt(s.next_run_at)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/25 uppercase tracking-wide">Last Run</p>
                    <p className="text-[10px] text-white/50">{fmt(s.last_run_at)}</p>
                  </div>
                  <div className="col-span-2 mt-1">
                    <p className="text-[9px] text-white/25 uppercase tracking-wide">Schedule ID</p>
                    <p className="text-[10px] text-white/30 font-mono truncate">{s.id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
