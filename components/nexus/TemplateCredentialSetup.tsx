"use client"

import { useState, useEffect } from "react"
import { Key, CheckCircle2, AlertCircle, Plus, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandIcon } from "./BrandIcon"

interface CredentialRequirement {
  provider: string
  hasCredential: boolean
  credentialId?: string
}

interface TemplateCredentialSetupProps {
  requirements: string[]
  onSetupComplete?: () => void
  onCancel?: () => void
}

const PROVIDER_NAMES: Record<string, string> = {
  "openai": "OpenAI",
  "anthropic": "Anthropic",
  "google-ai": "Google AI",
  "groq": "Groq",
  "openrouter": "OpenRouter",
  "mistral": "Mistral",
  "cohere": "Cohere",
  "github": "GitHub",
  "gitlab": "GitLab",
  "slack": "Slack",
  "discord": "Discord",
  "stripe": "Stripe",
  "notion": "Notion",
  "linear": "Linear",
  "twilio": "Twilio",
  "sendgrid": "SendGrid",
  "resend": "Resend",
  "supabase": "Supabase",
  "vercel": "Vercel",
  "aws": "AWS",
  "cloudflare": "Cloudflare",
  "airtable": "Airtable",
  "gmail": "Gmail",
  "telegram": "Telegram",
  "activecampaign": "ActiveCampaign",
  "acuity": "Acuity Scheduling",
  "affinity": "Affinity",
  "jotform": "JotForm",
  "typeform": "Typeform",
  "vonage": "Vonage",
  "mindee": "Mindee",
}

export function TemplateCredentialSetup({ requirements, onSetupComplete, onCancel }: TemplateCredentialSetupProps) {
  const [credentialStatus, setCredentialStatus] = useState<CredentialRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [addingProvider, setAddingProvider] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCredentialStatus()
  }, [requirements])

  const loadCredentialStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nexus/credentials')
      const data = await res.json()
      const credentials = data.credentials || []
      
      const status: CredentialRequirement[] = requirements.map(provider => ({
        provider,
        hasCredential: credentials.some((c: any) => c.provider === provider),
        credentialId: credentials.find((c: any) => c.provider === provider)?.id
      }))
      
      setCredentialStatus(status)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredential = async (provider: string) => {
    setSelectedProvider(provider)
    setFormFields({})
    setFormErrors({})
    setShowAddForm(true)
  }

  const handleSaveCredential = async () => {
    if (!selectedProvider) return

    setAddingProvider(selectedProvider)
    setFormErrors({})

    const errors: Record<string, string> = {}
    if (!formFields.apiKey && !formFields.clientId) {
      errors.apiKey = "API key is required"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setAddingProvider(null)
      return
    }

    try {
      const res = await fetch('/api/nexus/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          fields: formFields,
          autoSave: true
        })
      })

      if (res.ok) {
        await loadCredentialStatus()
        setShowAddForm(false)
        setSelectedProvider(null)
        setFormFields({})
      } else {
        const data = await res.json()
        setFormErrors({ general: data.error || 'Failed to save credential' })
      }
    } finally {
      setAddingProvider(null)
    }
  }

  const allComplete = credentialStatus.every(c => c.hasCredential)
  const progress = credentialStatus.filter(c => c.hasCredential).length / credentialStatus.length

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a12] border border-white/[0.1] rounded-2xl w-full max-w-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Key className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Setup Credentials</h3>
              <p className="text-sm text-white/50">
                This template requires {requirements.length} credential{requirements.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Setup progress</span>
            <span className="text-white/70">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Credential list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
          </div>
        ) : showAddForm && selectedProvider ? (
          <div className="space-y-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-2">
              <BrandIcon brand={selectedProvider} size={20} />
              <span className="text-sm font-medium text-white">{PROVIDER_NAMES[selectedProvider]}</span>
            </div>
            
            <div>
              <label className="text-xs text-white/40 block mb-1">API Key</label>
              <input
                type="password"
                value={formFields.apiKey || ''}
                onChange={e => setFormFields({ ...formFields, apiKey: e.target.value })}
                placeholder="Enter your API key"
                className={cn(
                  "w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none transition-colors",
                  formErrors.apiKey ? "border-red-500/50" : "border-white/[0.08] focus:border-violet-500/50"
                )}
              />
              {formErrors.apiKey && <p className="text-[10px] text-red-400 mt-1">{formErrors.apiKey}</p>}
            </div>

            {formErrors.general && <p className="text-xs text-red-400">{formErrors.general}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCredential}
                disabled={addingProvider === selectedProvider}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {addingProvider === selectedProvider ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Save Credential
              </button>
              <button
                onClick={() => { setShowAddForm(false); setSelectedProvider(null); setFormErrors({}) }}
                className="h-8 px-3 rounded-lg text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {credentialStatus.map((cred) => (
              <div
                key={cred.provider}
                className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <BrandIcon brand={cred.provider} size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{PROVIDER_NAMES[cred.provider]}</p>
                    <p className="text-[10px] text-white/30">
                      {cred.hasCredential ? "Credential saved" : "Required for this template"}
                    </p>
                  </div>
                </div>
                {cred.hasCredential ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <button
                    onClick={() => handleAddCredential(cred.provider)}
                    disabled={addingProvider !== null}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/30">
            Credentials are encrypted and stored securely
          </p>
          {allComplete && onSetupComplete && (
            <button
              onClick={onSetupComplete}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
