import { createClient } from "@/lib/supabase/server"
import { Activity, Info, AlertTriangle, XCircle, Bug, Filter } from "lucide-react"
import Link from "next/link"

async function getLogs(userId: string) {
  try {
    const supabase = await createClient()

    const { data: logs, error } = await supabase
      .from('api_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return logs?.map(log => ({
      id: log.id,
      level: (log.level || 'info').toLowerCase(),
      message: log.message,
      ipAddress: log.ip_address,
      metadata: log.metadata,
      createdAt: new Date(log.created_at).toLocaleString(),
      timestamp: formatRelativeTime(log.created_at),
    })) || []
  } catch (error) {
    console.error('Error fetching logs:', error)
    return []
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'Just now'
  }
}

const levelConfig: Record<string, { color: string; icon: any }> = {
  info: { color: 'bg-blue-500/10 text-blue-400', icon: Info },
  warning: { color: 'bg-yellow-500/10 text-yellow-400', icon: AlertTriangle },
  error: { color: 'bg-red-500/10 text-red-400', icon: XCircle },
  debug: { color: 'bg-white/[0.06] text-white/60', icon: Bug },
}

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const logs = await getLogs(user.id)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Logs</h1>
          <p className="text-white/50 text-sm">View activity and request logs for your developer account</p>
        </div>
        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white/[0.04] text-white/60 text-sm font-semibold hover:bg-white/[0.06] hover:text-white transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Logs List */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {logs.map((log) => {
          const config = levelConfig[log.level] || levelConfig.info
          const Icon = config.icon
          return (
            <div key={log.id} className="flex items-start gap-4 p-4 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition-colors">
              <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0 ${config.color}`}>
                <Icon className="h-3 w-3" />
                {log.level}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 break-words">{log.message}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/30">
                  <span>{log.createdAt}</span>
                  {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                  <span>{log.timestamp}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Activity className="h-12 w-12 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No logs yet</h3>
          <p className="text-sm text-white/40 mb-6">Activity and request logs will appear here once you start using the API</p>
          <Link
            href="/developer/keys"
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Create an API Key
          </Link>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-400 mb-1">Logging & Monitoring</h4>
            <p className="text-xs text-amber-400/70">Learn how to interpret logs and set up alerts for your applications.</p>
          </div>
          <Link
            href="/api-docs/logging"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Docs →
          </Link>
        </div>
      </div>
    </div>
  )
}
