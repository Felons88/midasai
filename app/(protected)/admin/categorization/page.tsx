"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Play, AlertTriangle, CheckCircle2, Clock, Tag, Sparkles, BarChart3 } from "lucide-react"

interface Status {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}

interface Uncategorized {
  id: string
  title: string
  type: string
  status: string
  created_at: string
  category_count: number
}

interface LowConfidence {
  listing_id: string
  category_slug: string
  category_name: string
  confidence: number
  title: string
  reason: string
}

export default function AdminCategorizationPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [uncategorized, setUncategorized] = useState<Uncategorized[]>([])
  const [lowConfidence, setLowConfidence] = useState<LowConfidence[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, uncatRes, lowRes] = await Promise.all([
        fetch("/api/admin/categorization-status"),
        fetch("/api/admin/categorization/uncategorized?limit=20"),
        fetch("/api/admin/categorization/low-confidence?limit=20&threshold=50"),
      ])

      if (statusRes.ok) setStatus(await statusRes.json())
      if (uncatRes.ok) setUncategorized((await uncatRes.json()).listings ?? [])
      if (lowRes.ok) setLowConfidence((await lowRes.json()).items ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function runWorker() {
    setRunning(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/categorize/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 5 }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Processed ${data.processed} jobs (${data.succeeded} succeeded, ${data.failed} failed)`)
      } else {
        setMessage(data.error || "Worker failed")
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Worker failed")
    } finally {
      setRunning(false)
      await fetchData()
    }
  }

  async function runBulk() {
    setBulkRunning(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE", limit: 100 }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Queued ${data.queued} listings for categorization`)
      } else {
        setMessage(data.error || "Bulk queue failed")
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk queue failed")
    } finally {
      setBulkRunning(false)
      await fetchData()
    }
  }

  async function categorizeOne(id: string) {
    try {
      const res = await fetch(`/api/admin/categorize/${id}`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Categorized listing ${id.slice(0, 8)}`)
      } else {
        setMessage(data.error || "Failed to categorize")
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed")
    } finally {
      await fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Categorization</h1>
          <p className="text-sm text-white/50">
            Manage marketplace categorization, tags, and AI analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={runBulk} disabled={bulkRunning}>
            <Sparkles className="h-4 w-4 mr-2" />
            {bulkRunning ? "Queueing..." : "Bulk Queue"}
          </Button>
          <Button onClick={runWorker} disabled={running} variant="secondary">
            <Play className="h-4 w-4 mr-2" />
            {running ? "Running..." : "Run Worker"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard icon={BarChart3} label="Total Jobs" value={status?.total ?? 0} />
        <StatusCard icon={Clock} label="Pending" value={status?.pending ?? 0} color="text-amber-400" />
        <StatusCard icon={RefreshCw} label="Processing" value={status?.processing ?? 0} color="text-blue-400" />
        <StatusCard icon={CheckCircle2} label="Completed" value={status?.completed ?? 0} color="text-emerald-400" />
        <StatusCard icon={AlertTriangle} label="Failed" value={status?.failed ?? 0} color="text-red-400" />
      </div>

      <Tabs defaultValue="uncategorized">
        <TabsList className="bg-white/5">
          <TabsTrigger value="uncategorized">Uncategorized</TabsTrigger>
          <TabsTrigger value="low-confidence">Low Confidence</TabsTrigger>
          <TabsTrigger value="recent">Recently Analyzed</TabsTrigger>
        </TabsList>

        <TabsContent value="uncategorized" className="space-y-4">
          <Card className="bg-[#0c0c12] border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-amber-400" />
                Uncategorized Listings
              </CardTitle>
              <CardDescription className="text-white/50">
                Listings with no AI or manual categories assigned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uncategorized.length === 0 ? (
                <p className="text-sm text-white/50">All listings are categorized.</p>
              ) : (
                <div className="space-y-2">
                  {uncategorized.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-white/40">
                          {item.type} · {item.status} · {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => categorizeOne(item.id)}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Categorize
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-confidence" className="space-y-4">
          <Card className="bg-[#0c0c12] border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Low Confidence Categories
              </CardTitle>
              <CardDescription className="text-white/50">
                AI assignments with confidence below 50%. Review and recategorize.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowConfidence.length === 0 ? (
                <p className="text-sm text-white/50">No low-confidence categories found.</p>
              ) : (
                <div className="space-y-2">
                  {lowConfidence.map((item, index) => (
                    <div
                      key={`${item.listing_id}-${item.category_slug}-${index}`}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                          {item.confidence.toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-white/50 mb-2">
                        {item.category_name} · {item.reason}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => categorizeOne(item.listing_id)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Recategorize
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-[#0c0c12] border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Recently Analyzed</CardTitle>
              <CardDescription className="text-white/50">
                Latest completed categorization jobs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentlyAnalyzed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusCard({
  icon: Icon,
  label,
  value,
  color = "text-white",
}: {
  icon: React.ElementType
  label: string
  value: number
  color?: string
}) {
  return (
    <Card className="bg-[#0c0c12] border-white/[0.06]">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardContent>
    </Card>
  )
}

function RecentlyAnalyzed() {
  const [jobs, setJobs] = useState<{ id: string; listing_id: string; status: string; completed_at: string | null; created_at: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/categorization/jobs?limit=20&status=completed")
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-white/50">Loading...</p>
  if (jobs.length === 0) return <p className="text-sm text-white/50">No recently analyzed jobs.</p>

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div>
            <p className="text-sm font-medium text-white">Listing {job.listing_id.slice(0, 8)}</p>
            <p className="text-xs text-white/40">
              {job.status} · {job.completed_at ? new Date(job.completed_at).toLocaleString() : "—"}
            </p>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
            {job.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}
