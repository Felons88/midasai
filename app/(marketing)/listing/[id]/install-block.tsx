'use client'

import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

interface InstallBlockProps {
  label: string
  command: string
}

export function InstallBlock({ label, command }: InstallBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); ignore.
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 text-text-tertiary">
          <Terminal className="h-3.5 w-3.5" />
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label} command`}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto">
        <code className="text-sm text-cta font-mono whitespace-pre">{command}</code>
      </pre>
    </div>
  )
}
