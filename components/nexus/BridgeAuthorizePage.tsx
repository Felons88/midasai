"use client"

import { useEffect, useState, use } from "react"
import { MonitorCog, ShieldCheck, ShieldX, Loader2, CheckCircle2, XCircle, Clock, Cpu, Monitor, Globe2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BridgeRequest {
  id: string
  token: string
  ide_name: string
  ide_version?: string | null
  device_name: string
  device_os?: string | null
  device_arch?: string | null
  bridge_port: number
  bridge_version?: string | null
  status: string
  expires_at: string
  created_at: string
}

type State = "loading" | "ready" | "approving" | "approved" | "denied" | "expired" | "error"

const IDE_COLORS: Record<string, string> = {
  "Windsurf": "from-sky-500/20 to-blue-600/10",
  "Cursor":   "from-violet-500/20 to-purple-600/10",
  "VS Code":  "from-blue-500/20 to-blue-700/10",
}

const IDE_ACCENT: Record<string, string> = {
  "Windsurf": "text-sky-400",
  "Cursor":   "text-violet-400",
  "VS Code":  "text-blue-400",
}

function Pill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <Icon className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25">{label}</p>
        <p className="text-[12px] font-medium text-white/80 truncate">{value}</p>
      </div>
    </div>
  )
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining("Expired"); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${m}:${String(s).padStart(2, "0")}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  const isLow = new Date(expiresAt).getTime() - Date.now() < 60000
  return (
    <span className={cn("font-mono text-xs", isLow ? "text-red-400" : "text-white/40")}>
      {remaining}
    </span>
  )
}

export function BridgeAuthorizePage({ paramsPromise }: { paramsPromise: Promise<{ token: string }> }) {
  const { token } = use(paramsPromise)
  const [state, setState] = useState<State>("loading")
  const [req, setReq] = useState<BridgeRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/nexus/bridge/authorize/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setState("error"); setError(data.error); return }
        if (data.request.status === "approved") { setState("approved"); return }
        if (data.request.status === "denied")   { setState("denied"); return }
        if (data.request.status === "expired")  { setState("expired"); return }
        setReq(data.request)
        setState("ready")
      })
      .catch(() => { setState("error"); setError("Failed to load request") })
  }, [token])

  const handleAction = async (action: "approve" | "deny") => {
    setState("approving")
    const res = await fetch(`/api/nexus/bridge/authorize/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (!res.ok) {
      setState("error")
      setError(data.error ?? "Something went wrong")
      return
    }
    setState(action === "approve" ? "approved" : "denied")
  }

  const accentClass = req ? (IDE_ACCENT[req.ide_name] ?? "text-violet-400") : "text-violet-400"
  const gradientClass = req ? (IDE_COLORS[req.ide_name] ?? "from-violet-500/20 to-purple-600/10") : ""

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className={cn("fixed inset-0 pointer-events-none", state === "ready" && `bg-gradient-radial ${gradientClass} opacity-30`)} />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">MidasAI</span>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 text-white/40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading authorization request…</p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Request invalid</p>
            <p className="text-sm text-white/40">{error ?? "This link is not valid."}</p>
          </div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <Clock className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Link expired</p>
            <p className="text-sm text-white/40">This authorization link has expired. Run <code className="font-mono bg-white/10 px-1 rounded">npx midas-bridge</code> again to get a new link.</p>
          </div>
        )}

        {/* Approved */}
        {state === "approved" && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold mb-2">Connection approved</p>
            <p className="text-sm text-white/50 leading-relaxed">
              {req?.ide_name ?? "Your IDE"} is now authorized to connect to MidasAI.<br />
              You can close this window — the bridge will start automatically.
            </p>
          </div>
        )}

        {/* Denied */}
        {state === "denied" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <ShieldX className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold mb-2">Connection denied</p>
            <p className="text-sm text-white/50 leading-relaxed">
              The bridge connection was rejected. The IDE session will be closed.<br />
              If this was a mistake, run <code className="font-mono bg-white/10 px-1 rounded">npx midas-bridge</code> again.
            </p>
          </div>
        )}

        {/* Ready — main approval card */}
        {(state === "ready" || state === "approving") && req && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center", gradientClass.replace("from-", "bg-").split(" ")[0] + "/20")}>
                  <MonitorCog className={cn("h-6 w-6", accentClass)} />
                </div>
                <div>
                  <p className="text-white font-semibold text-base">{req.ide_name}</p>
                  <p className="text-xs text-white/40">is requesting access to your MidasAI workspace</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/30">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/60" />
                <span>Secure local connection · No data leaves your machine</span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <ExpiryCountdown expiresAt={req.expires_at} />
                </span>
              </div>
            </div>

            {/* Device info */}
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">Device requesting access</p>
              <div className="grid grid-cols-2 gap-2">
                <Pill label="Device" value={req.device_name} icon={Monitor} />
                <Pill label="IDE" value={`${req.ide_name}${req.ide_version ? ` ${req.ide_version}` : ""}`} icon={MonitorCog} />
                {req.device_os && (
                  <Pill label="OS" value={req.device_os} icon={Globe2} />
                )}
                {req.device_arch && (
                  <Pill label="Arch" value={req.device_arch} icon={Cpu} />
                )}
              </div>
            </div>

            {/* What access means */}
            <div className="px-6 pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">This will allow</p>
              <ul className="space-y-1.5">
                {[
                  "Read your open files and workspace context",
                  "Receive workflow outputs in your editor",
                  "Sync Nexus canvas nodes with IDE actions",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-white/20 mt-3">
                Connected to port <span className="font-mono text-white/30">{req.bridge_port}</span> on localhost · Device will be remembered
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2.5">
              <Button
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0"
                disabled={state === "approving"}
                onClick={() => handleAction("approve")}
              >
                {state === "approving" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Authorize {req.ide_name}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 text-sm text-white/40 hover:text-red-400"
                disabled={state === "approving"}
                onClick={() => handleAction("deny")}
              >
                Deny access
              </Button>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white/[0.01] border-t border-white/[0.04] text-center">
              <p className="text-[10px] text-white/20">
                Only approve if you just ran <span className="font-mono text-white/30">npx midas-bridge</span> on this device.
                You can revoke access anytime from Nexus → Bridge settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
