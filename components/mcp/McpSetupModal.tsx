"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileJson,
  MessageSquare,
  Terminal,
} from "lucide-react"
import {
  getMcpDownloadBundle,
  getMcpSetupPrompt,
  getMcpToolConfig,
  MCP_CLIENT_TOOLS,
  type McpClientTool,
} from "@/lib/mcp/setup-templates"

type McpSetupModalProps = {
  token: string
  connectionName: string
  siteUrl: string
  onClose: () => void
}

export function McpSetupModal({
  token,
  connectionName,
  siteUrl,
  onClose,
}: McpSetupModalProps) {
  const router = useRouter()
  const [tool, setTool] = useState<McpClientTool>("cursor")
  const [copied, setCopied] = useState<"config" | "prompt" | "token" | null>(null)

  const ctx = useMemo(
    () => ({
      connectionName,
      token,
      endpoint: `${siteUrl}/api/mcp`,
      siteUrl,
    }),
    [connectionName, token, siteUrl]
  )

  const selected = MCP_CLIENT_TOOLS.find((t) => t.id === tool) ?? MCP_CLIENT_TOOLS[0]
  const config = getMcpToolConfig(tool, ctx)
  const prompt = getMcpSetupPrompt(tool, ctx)
  const showJson = selected.format === "json" || selected.format === "shell"

  const copy = async (text: string, key: typeof copied) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = () => {
    const content = getMcpDownloadBundle(ctx)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `midasai-mcp-${connectionName.toLowerCase().replace(/\s+/g, "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-4 bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">MCP connection ready</h2>
              <p className="text-xs text-amber-400/80">
                Token for &ldquo;{connectionName}&rdquo; — save it now. It won&apos;t be shown again.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/20">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
              MCP token
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs text-amber-400 font-mono break-all">{token}</code>
              <button
                type="button"
                onClick={() => copy(token, "token")}
                className="p-1.5 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0"
              >
                {copied === "token" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-white/40" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-white/35 mt-2">
              Stored in Supabase for your account. Agents use this token to call{" "}
              <code className="text-white/50">{ctx.endpoint}</code> — not to create connections.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              What are you using?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MCP_CLIENT_TOOLS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTool(item.id)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    tool === item.id
                      ? "border-amber-500/50 bg-amber-500/10 text-white"
                      : "border-white/[0.08] bg-white/[0.02] text-white/70 hover:border-white/20"
                  }`}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {showJson ? (
                  <FileJson className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/60">{selected.configLabel}</p>
                  <p className="text-[10px] text-white/35 truncate">{selected.configPath}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {showJson && (
                  <button
                    type="button"
                    onClick={() => copy(config, "config")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-white/[0.1] text-white/60 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                  >
                    {copied === "config" ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy JSON
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copy(prompt, "prompt")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors"
                >
                  {copied === "prompt" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  Copy prompt
                </button>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/60 font-mono overflow-x-auto max-h-56 overflow-y-auto whitespace-pre-wrap">
              {showJson ? config : prompt}
            </pre>
            {selected.format === "shell" && (
              <p className="flex items-center gap-1.5 text-[11px] text-white/40 mt-2">
                <Terminal className="h-3 w-3" />
                Run the command in your project terminal, or merge the JSON block into Claude Code settings.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
            >
              <Download className="h-4 w-4" /> Download all configs
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                router.refresh()
              }}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
            >
              I&apos;ve saved my setup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
