"use client"

import { useState, useCallback } from "react"
import { X, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, Eye, EyeOff, Key, Loader2, Sparkles } from "lucide-react"
import { BrandIcon } from "./BrandIcon"
import { cn } from "@/lib/utils"
import type { NodeDefinition, NodeField } from "@/lib/nexus/node-registry"

export interface NodeConfigValues {
  [key: string]: unknown
}

export type ValidationState = "valid" | "warning" | "error" | "idle"

export interface NodeConfigPanelProps {
  node: NodeDefinition
  values: NodeConfigValues
  onChange: (key: string, value: unknown) => void
  onClose: () => void
  validationState?: ValidationState
  validationMessage?: string
}

export function NodeConfigPanel({ node, values, onChange, onClose, validationState = "idle", validationMessage }: NodeConfigPanelProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(["Advanced"]))
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set())
  const [savingCredential, setSavingCredential] = useState<string | null>(null)
  const [savedCredentials, setSavedCredentials] = useState<Set<string>>(new Set())

  const toggleGroup = (g: string) => setCollapsedGroups(prev => {
    const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n
  })
  const toggleSecret = (k: string) => setShowSecrets(prev => {
    const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n
  })

  const handleSaveCredential = useCallback(async (field: NodeField) => {
    if (!field.credentialProvider) return

    setSavingCredential(field.key)
    try {
      const response = await fetch('/api/nexus/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: field.credentialProvider,
          fields: { [field.key]: values[field.key] },
          autoSave: true
        })
      })

      if (response.ok) {
        setSavedCredentials(prev => new Set([...prev, field.key]))
      }
    } finally {
      setSavingCredential(null)
    }
  }, [values])

  // Group fields
  const groups = new Map<string, NodeField[]>()
  groups.set("__main__", [])
  for (const field of node.fields) {
    const g = field.group ?? "__main__"
    if (!groups.has(g)) groups.set(g, [])
    // Check showIf
    if (field.showIf) {
      const passes = Object.entries(field.showIf).every(([k, v]) => {
        const cur = values[k]
        return Array.isArray(v) ? v.includes(cur) : cur === v
      })
      if (!passes) continue
    }
    groups.get(g)!.push(field)
  }

  const statusIcon = {
    valid: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
    error: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
    idle: null,
  }[validationState]

  return (
    <div className="w-[320px] flex-shrink-0 h-full flex flex-col border-l border-white/[0.06] bg-[#0a0a12] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <div
          className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center text-sm"
          style={{ background: node.color + "20", color: node.color }}
        >
          {node.icon.length === 1 ? node.icon : <BrandIcon brand={node.icon} size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{node.name}</p>
          <p className="text-[10px] text-white/30 leading-tight truncate mt-0.5">{node.description}</p>
        </div>
        {statusIcon && (
          <div title={validationMessage} className="flex-shrink-0">{statusIcon}</div>
        )}
        <button onClick={onClose} className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Validation message */}
      {validationMessage && validationState !== "idle" && (
        <div className={cn("mx-3 mt-3 px-3 py-2 rounded-lg text-xs", {
          "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20": validationState === "valid",
          "bg-amber-500/10 text-amber-300 border border-amber-500/20": validationState === "warning",
          "bg-red-500/10 text-red-300 border border-red-500/20": validationState === "error",
        })}>
          {validationMessage}
        </div>
      )}

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {[...groups.entries()].map(([groupName, fields]) => {
          if (fields.length === 0) return null
          const isMain = groupName === "__main__"
          const isCollapsed = collapsedGroups.has(groupName)

          return (
            <div key={groupName}>
              {!isMain && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center gap-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/40 transition-colors"
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {groupName}
                </button>
              )}
              {(!isCollapsed || isMain) && (
                <div className="space-y-3">
                  {fields.map(field => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={values[field.key] ?? field.default ?? ""}
                      onChange={v => onChange(field.key, v)}
                      showSecret={showSecrets.has(field.key)}
                      onToggleSecret={() => toggleSecret(field.key)}
                      onSaveCredential={() => handleSaveCredential(field)}
                      isSavingCredential={savingCredential === field.key}
                      isCredentialSaved={savedCredentials.has(field.key)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Ports */}
      <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Ports</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] text-white/20 uppercase mb-1">Inputs</p>
            {node.inputs.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] text-white/40">{p.label}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[9px] text-white/20 uppercase mb-1">Outputs</p>
            {node.outputs.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-white/40">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FieldRendererProps {
  field: NodeField
  value: unknown
  onChange: (v: unknown) => void
  showSecret: boolean
  onToggleSecret: () => void
  onSaveCredential?: () => void
  isSavingCredential?: boolean
  isCredentialSaved?: boolean
}

function FieldRenderer({ field, value, onChange, showSecret, onToggleSecret, onSaveCredential, isSavingCredential, isCredentialSaved }: FieldRendererProps) {
  const baseInput = "w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/[0.2] transition-colors"

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-white/50">
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {field.description && (
          <span className="text-[9px] text-white/20 max-w-[140px] text-right leading-tight">{field.description}</span>
        )}
      </div>

      {field.type === "select" && (
        <select
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          className={cn(baseInput, "cursor-pointer")}
        >
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: "#111" }}>{opt.label}</option>
          ))}
        </select>
      )}

      {field.type === "multiselect" && (
        <div className="space-y-1">
          {field.options?.map(opt => {
            const arr = Array.isArray(value) ? value as string[] : []
            const checked = arr.includes(opt.value)
            return (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? arr.filter(v => v !== opt.value) : [...arr, opt.value]
                    onChange(next)
                  }}
                  className="rounded border-white/20 bg-white/[0.04] accent-violet-500"
                />
                <span className="text-xs text-white/50 group-hover:text-white/70">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}

      {(field.type === "string" || field.type === "url" || field.type === "number") && (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={e => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}

      {field.type === "secret" && (
        <div className="relative">
          <input
            type={showSecret ? "text" : "password"}
            value={String(value ?? "")}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder ?? "••••••••"}
            className={cn(baseInput, field.credentialProvider ? "pr-16" : "pr-8")}
          />
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
          >
            {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          {field.credentialProvider && (
            <button
              type="button"
              onClick={onSaveCredential}
              disabled={isSavingCredential || isCredentialSaved || !value}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isCredentialSaved ? "Credential saved" : "Save to credential vault"}
            >
              {isSavingCredential ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isCredentialSaved ? (
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              ) : (
                <Key className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      )}

      {(field.type === "textarea" || field.type === "code") && (
        <textarea
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === "code" ? 6 : 3}
          className={cn(baseInput, "resize-none font-mono leading-relaxed")}
        />
      )}

      {field.type === "boolean" && (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            value ? "bg-violet-600" : "bg-white/10"
          )}
        >
          <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", value ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      )}

      {field.type === "json" && (
        <textarea
          value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          onChange={e => {
            try { onChange(JSON.parse(e.target.value)) } catch { onChange(e.target.value) }
          }}
          placeholder={field.placeholder ?? "{}"}
          rows={4}
          className={cn(baseInput, "resize-none font-mono text-[11px] leading-relaxed")}
        />
      )}
    </div>
  )
}
