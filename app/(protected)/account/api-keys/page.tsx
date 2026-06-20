import { Key, Copy } from "lucide-react"

export default function ApiKeysPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">API Keys</h1>
        <p className="text-white/50 text-sm">Manage your API keys for programmatic access</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your API Keys</h2>
            <button className="h-9 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors">
              Generate Key
            </button>
          </div>
          <div className="flex flex-col items-center py-8 text-center">
            <Key className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm text-white/40">No API keys created yet</p>
            <p className="text-[11px] text-white/20 mt-1">Generate a key to access the MidasAI API</p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-2">API Documentation</h2>
          <p className="text-sm text-white/40 mb-4">Learn how to integrate with the MidasAI API to programmatically manage your listings and data.</p>
          <a href="/docs" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            View Documentation →
          </a>
        </div>
      </div>
    </div>
  )
}
