"use client"

import { useState, useEffect, useRef } from "react"
import { X, ExternalLink, Check, Loader2, Key, Link2, ChevronRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandIcon } from "./BrandIcon"
import type { Integration } from "@/lib/nexus/integration-registry"
import { OAUTH_PROVIDERS } from "@/lib/nexus/integration-registry"

type Phase = "spin" | "expand" | "form" | "connecting" | "done" | "skip"

interface NodeAuthPopupProps {
  /** Canvas position of the new node (screen coords, not canvas coords) */
  screenX: number
  screenY: number
  /** The first required integration */
  integration: Integration
  /** Called with saved credential id (or undefined if skipped) */
  onComplete: (credentialId?: string) => void
  onCancel: () => void
}

export function NodeAuthPopup({ screenX, screenY, integration, onComplete, onCancel }: NodeAuthPopupProps) {
  const [phase, setPhase] = useState<Phase>("spin")
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [oauthWindow, setOauthWindow] = useState<Window | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Spin → expand after 600ms
  useEffect(() => {
    const t = setTimeout(() => setPhase("expand"), 600)
    return () => clearTimeout(t)
  }, [])

  // expand → form after css transition (400ms)
  useEffect(() => {
    if (phase !== "expand") return
    const t = setTimeout(() => setPhase("form"), 420)
    return () => clearTimeout(t)
  }, [phase])

  // Listen for OAuth completion message from popup window
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "nexus_oauth_complete") return
      const { credentialId } = e.data as { credentialId: string }
      oauthWindow?.close()
      setPhase("done")
      setTimeout(() => onComplete(credentialId), 800)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [oauthWindow, onComplete])

  const handleOAuth = () => {
    setPhase("connecting")
    const url = `/api/nexus/oauth/${integration.id}/authorize`
    const w = window.open(url, `nexus_oauth_${integration.id}`, "width=600,height=700,left=200,top=100")
    setOauthWindow(w)
  }

  const handleSaveApiKey = async () => {
    setError(null)
    // Validate required fields
    const missing = integration.fields?.filter(f => f.required && !fields[f.key]?.trim())
    if (missing?.length) {
      setError(`${missing[0].label} is required`)
      return
    }
    setSaving(true)
    try {
      // Save as a credential — combine all fields into value as JSON
      const value = JSON.stringify(fields)
      const res = await fetch("/api/nexus/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: integration.id, name: integration.name, value }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { credential: { id: string } }
      setPhase("done")
      setTimeout(() => onComplete(data.credential.id), 600)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const isOAuth = OAUTH_PROVIDERS.has(integration.id)

  // Popup dimensions
  const popupW = 340
  const popupH = isOAuth ? 260 : (integration.fields?.length ?? 1) * 64 + 200

  // Clamp to viewport
  const left = Math.min(Math.max(screenX - popupW / 2, 8), window.innerWidth - popupW - 8)
  const top = Math.min(Math.max(screenY - 40, 8), window.innerHeight - popupH - 8)

  return (
    <>
      {/* Backdrop to capture outside click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onCancel}
      />

      {/* The popup */}
      <div
        ref={popupRef}
        className={cn(
          "fixed z-50 origin-center",
          "transition-all duration-400 ease-out",
          phase === "spin" && "animate-[spin_0.5s_linear]",
        )}
        style={{
          left: phase === "spin" || phase === "expand"
            ? screenX - 20
            : left,
          top: phase === "spin" || phase === "expand"
            ? screenY - 20
            : top,
          width: phase === "spin" || phase === "expand" ? 40 : popupW,
          height: phase === "spin" || phase === "expand" ? 40 : "auto",
        }}
      >
        {/* Spinning node icon */}
        {(phase === "spin" || phase === "expand") && (
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-xl"
            style={{ background: integration.color + "30", border: `2px solid ${integration.color}60` }}
          >
            {integration.icon.length <= 2
              ? <span style={{ fontSize: 18 }}>{integration.icon}</span>
              : <BrandIcon brand={integration.icon} size={20} />
            }
          </div>
        )}

        {/* Full popup form */}
        {(phase === "form" || phase === "connecting" || phase === "done") && (
          <div
            className="rounded-2xl border border-white/[0.1] bg-[#0d0d1a] shadow-2xl overflow-hidden"
            style={{ boxShadow: `0 0 40px ${integration.color}20, 0 20px 60px rgba(0,0,0,0.6)` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/[0.06]">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: integration.color + "20" }}
              >
                {integration.icon.length <= 2
                  ? <span style={{ fontSize: 16 }}>{integration.icon}</span>
                  : <BrandIcon brand={integration.icon} size={18} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Connect {integration.name}</p>
                <p className="text-[10px] text-white/40 truncate">{integration.description}</p>
              </div>
              <button
                onClick={onCancel}
                className="h-6 w-6 flex items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-4 py-3">
              {/* Done state */}
              {phase === "done" && (
                <div className="py-4 flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Connected!</p>
                  <p className="text-xs text-white/40">Placing node on canvas…</p>
                </div>
              )}

              {/* Connecting state (OAuth waiting) */}
              {phase === "connecting" && (
                <div className="py-4 flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Waiting for authorization…</p>
                    <p className="text-xs text-white/40 mt-0.5">Complete sign-in in the popup window</p>
                  </div>
                  <button
                    onClick={() => { oauthWindow?.focus() }}
                    className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
                  >
                    Reopen window
                  </button>
                </div>
              )}

              {/* Form state */}
              {phase === "form" && (
                <>
                  {isOAuth ? (
                    <div className="space-y-3">
                      {/* OAuth scopes display */}
                      {integration.oauthScopes && (
                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                          <p className="text-[9px] text-white/30 uppercase tracking-wide mb-1.5">Permissions requested</p>
                          <div className="flex flex-wrap gap-1">
                            {integration.oauthScopes.slice(0, 6).map(s => (
                              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20 font-mono">
                                {s.split("/").pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleOAuth}
                        className="w-full h-9 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-colors"
                        style={{ background: integration.color, color: "#fff" }}
                      >
                        <Link2 className="h-4 w-4" />
                        Connect with {integration.name}
                      </button>
                      <button
                        onClick={() => onComplete(undefined)}
                        className="w-full h-7 text-xs text-white/30 hover:text-white/50 transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {integration.fields?.map(field => (
                        <div key={field.key}>
                          <label className="block text-[10px] text-white/40 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-0.5">*</span>}
                          </label>
                          <input
                            type={field.type === "password" ? "password" : field.type === "url" ? "url" : "text"}
                            value={fields[field.key] ?? ""}
                            onChange={e => setFields(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/60 transition-colors"
                            autoComplete="off"
                          />
                          {field.hint && (
                            <p className="text-[9px] text-white/25 mt-0.5">{field.hint}</p>
                          )}
                        </div>
                      ))}

                      {error && (
                        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                          <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                          <p className="text-xs text-red-300">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => onComplete(undefined)}
                          className="flex-1 h-8 rounded-lg text-xs text-white/30 hover:text-white/50 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                        >
                          Skip
                        </button>
                        <button
                          onClick={handleSaveApiKey}
                          disabled={saving}
                          className="flex-1 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
                          {saving ? "Saving…" : "Save & Connect"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Docs link */}
                  {integration.docsUrl && (
                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 mt-2 transition-colors"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      Documentation
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/** Check which integrations a node needs that the user hasn't connected yet */
export async function getMissingIntegrations(credentialKeys: string[]): Promise<string[]> {
  if (credentialKeys.length === 0) return []
  try {
    const res = await fetch("/api/nexus/credentials")
    if (!res.ok) return credentialKeys
    const data = await res.json() as { credentials: Array<{ provider: string }> }
    const connectedProviders = new Set(data.credentials.map(c => c.provider))
    return credentialKeys.filter(k => !connectedProviders.has(k))
  } catch {
    return credentialKeys
  }
}
