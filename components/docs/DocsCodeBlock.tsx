"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

type DocsCodeBlockProps = {
  code: string
  language?: string
  title?: string
  className?: string
}

export function DocsCodeBlock({ code, language = "bash", title, className }: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("my-4 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d0d14]", className)}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="text-xs font-medium text-white/50">{title ?? language}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  )
}
