"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, XCircle, Terminal, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CliAuthPageProps {
  token: string
  user: { email: string; id: string }
}

type State = "ready" | "approving" | "approved" | "denied" | "error"

export function CliAuthPage({ token, user }: CliAuthPageProps) {
  const [state, setState] = useState<State>("ready")
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (action: "approve" | "deny") => {
    setState("approving")
    const res = await fetch(`/api/cli/auth/${token}`, {
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

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">MidasAI</span>
      </div>

      {/* Error */}
      {state === "error" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Request failed</p>
          <p className="text-sm text-white/40">{error ?? "Something went wrong."}</p>
        </div>
      )}

      {/* Approved */}
      {state === "approved" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-white text-xl font-semibold mb-2">CLI authorized</p>
          <p className="text-sm text-white/50 leading-relaxed">
            The Midas Bridge CLI is now connected to your account.<br />
            You can close this window and return to your terminal.
          </p>
        </div>
      )}

      {/* Denied */}
      {state === "denied" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl font-semibold mb-2">Authorization denied</p>
          <p className="text-sm text-white/50 leading-relaxed">
            The CLI connection was rejected.<br />
            Run <code className="font-mono bg-white/10 px-1 rounded">npx @midasai/bridge login</code> to try again.
          </p>
        </div>
      )}

      {/* Ready — main approval card */}
      {(state === "ready" || state === "approving") && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden w-full max-w-md">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Terminal className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-base">Midas Bridge CLI</p>
                <p className="text-xs text-white/40">is requesting access to your account</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/30">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/60" />
              <span>Secure connection · CLI authentication</span>
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">You are signed in as</p>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <p className="text-sm font-medium text-white/90">{user.email}</p>
            </div>
          </div>

          {/* What access means */}
          <div className="px-6 pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">This will allow</p>
            <ul className="space-y-1.5">
              {[
                "Connect your IDE to MidasAI Nexus",
                "Sync workspace context with your account",
                "Authorize bridge devices without browser approval",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-white/50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
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
              Authorize CLI
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
              Only approve if you just ran <span className="font-mono text-white/30">npx @midasai/bridge login</span>.
              You can revoke access anytime from Developer → Integrations.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
