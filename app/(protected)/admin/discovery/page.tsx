"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Archive,
  Search,
  Star,
  GitFork,
  Clock,
} from "lucide-react"

function timeAgo(iso: string | null): string {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const statusColor: Record<string, string> = {
  pending: "text-amber-400",
  processing: "text-blue-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
  archived: "text-white/40",
  new: "text-amber-400",
  queued: "text-blue-400",
  imported: "text-emerald-400",
}

type Query = {
  id: string
  name: string
  query: string
  sort: string
  order: string
  language: string | null
  topics: string[]
  min_stars: number
  enabled: boolean
  schedule_cron: string | null
  last_run_at: string | null
  created_at: string
}

type Job = {
  id: string
  status: string
  repos_found: number
  repos_new: number
  repos_duplicated: number
  repos_failed: number
  created_at: string
  completed_at: string | null
  discovery_queries: { name: string } | null
}

type Repo = {
  id: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  primary_language: string | null
  status: string
  has_readme: boolean
  created_at: string
  repository_classifications: { primary_category: string | null; quality_score: number | null } | null
}

type QueueItem = {
  id: string
  status: string
  priority: number
  created_at: string
  discovered_repositories: Repo | null
  listings: { id: string; title: string } | null
}

export default function DiscoveryPage() {
  const [queries, setQueries] = useState<Query[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"queries" | "jobs" | "repos" | "queue">("queries")
  const [form, setForm] = useState({
    name: "",
    query: "prompts",
    sort: "stars",
    order: "desc",
    language: "",
    topics: "",
    min_stars: 10,
  })
  const [running, setRunning] = useState<string | null>(null)
  const [classifying, setClassifying] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [qRes, jRes, rRes, quRes] = await Promise.all([
        fetch("/api/admin/discovery/queries"),
        fetch("/api/admin/discovery/jobs"),
        fetch("/api/admin/discovery/repositories?limit=50"),
        fetch("/api/admin/discovery/queue?limit=50"),
      ])
      const [qData, jData, rData, quData] = await Promise.all([
        qRes.json(),
        jRes.json(),
        rRes.json(),
        quRes.json(),
      ])
      setQueries(qData.queries ?? [])
      setJobs(jData.jobs ?? [])
      setRepos(rData.repositories ?? [])
      setQueue(quData.queue ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function createQuery(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/admin/discovery/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        language: form.language || null,
        topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      setForm({ name: "", query: "prompts", sort: "stars", order: "desc", language: "", topics: "", min_stars: 10 })
      loadData()
    } else {
      const data = await res.json()
      alert(data.error || "Failed to create query")
    }
  }

  async function runQuery(queryId: string) {
    setRunning(queryId)
    const res = await fetch("/api/admin/discovery/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query_id: queryId }),
    })
    setRunning(null)
    if (res.ok) {
      await loadData()
      setActiveTab("jobs")
    } else {
      const data = await res.json()
      alert(data.error || "Discovery failed")
    }
  }

  async function classifyPending() {
    setClassifying(true)
    await fetch("/api/admin/discovery/classify", { method: "GET" })
    setClassifying(false)
    loadData()
  }

  async function reviewQueue(queueId: string, action: "approve" | "reject" | "archive") {
    const res = await fetch("/api/admin/discovery/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queue_id: queueId, action }),
    })
    if (res.ok) loadData()
    else alert("Failed to update queue")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">GitHub Discovery</h1>
          <p className="text-sm text-white/50">Discover, classify, and import AI resource repositories.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={classifyPending}
            disabled={classifying}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] text-white/70 hover:bg-white/[0.08] text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${classifying ? "animate-spin" : ""}`} />
            Classify Pending
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-black text-sm font-bold hover:bg-amber-400"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(["queries", "jobs", "repos", "queue"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/50 text-sm">Loading…</div>
      ) : activeTab === "queries" ? (
        <div className="space-y-6">
          <form onSubmit={createQuery} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="space-y-1">
              <label className="text-xs text-white/40">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder:text-white/30"
                placeholder="Top prompts"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Query</label>
              <input
                value={form.query}
                onChange={(e) => setForm({ ...form, query: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder:text-white/30"
                placeholder="prompts"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Language</label>
              <input
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder:text-white/30"
                placeholder="typescript"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Topics</label>
              <input
                value={form.topics}
                onChange={(e) => setForm({ ...form, topics: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder:text-white/30"
                placeholder="claude, cursor"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Min stars</label>
              <input
                type="number"
                value={form.min_stars}
                onChange={(e) => setForm({ ...form, min_stars: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Sort</label>
              <select
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white"
              >
                <option value="stars">Stars</option>
                <option value="updated">Updated</option>
                <option value="forks">Forks</option>
                <option value="best-match">Best match</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Order</label>
              <select
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-bold hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                Add Query
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Query</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Sort</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Min Stars</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Last Run</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {queries.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{q.name}</td>
                    <td className="px-4 py-3 text-white/60">{q.query}</td>
                    <td className="px-4 py-3 text-white/60">{q.sort} {q.order}</td>
                    <td className="px-4 py-3 text-white/60">{q.min_stars}</td>
                    <td className="px-4 py-3 text-white/60">
                      {timeAgo(q.last_run_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => runQuery(q.id)}
                        disabled={running === q.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        <Play className="h-3 w-3" />
                        {running === q.id ? "Running…" : "Run"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "jobs" ? (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Query</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Found</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">New</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Duplicated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Failed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{j.discovery_queries?.name ?? "Unknown"}</td>
                  <td className={`px-4 py-3 font-semibold ${statusColor[j.status] || "text-white/60"}`}>{j.status}</td>
                  <td className="px-4 py-3 text-white/60">{j.repos_found}</td>
                  <td className="px-4 py-3 text-white/60">{j.repos_new}</td>
                  <td className="px-4 py-3 text-white/60">{j.repos_duplicated}</td>
                  <td className="px-4 py-3 text-white/60">{j.repos_failed}</td>
                  <td className="px-4 py-3 text-white/60">{timeAgo(j.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === "repos" ? (
        <div className="space-y-3">
          {repos.map((r) => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{r.full_name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] ${statusColor[r.status] || "text-white/60"}`}>{r.status}</span>
                  {r.has_readme && <span className="text-xs text-white/40">README</span>}
                </div>
                <p className="text-sm text-white/50 truncate">{r.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {r.stargazers_count.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {r.forks_count.toLocaleString()}</span>
                  <span>{r.primary_language}</span>
                  <span>{r.repository_classifications?.primary_category}</span>
                  <span>Quality: {r.repository_classifications?.quality_score ?? "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{item.discovered_repositories?.full_name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] ${statusColor[item.status] || "text-white/60"}`}>{item.status}</span>
                  <span className="text-xs text-white/40">Priority {item.priority}</span>
                </div>
                <p className="text-sm text-white/50 truncate">{item.discovered_repositories?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => reviewQueue(item.id, "approve")}
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => reviewQueue(item.id, "reject")}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  <XCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => reviewQueue(item.id, "archive")}
                  className="p-2 rounded-lg bg-white/[0.06] text-white/50 hover:bg-white/[0.1]"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
