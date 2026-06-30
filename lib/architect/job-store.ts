"use client"

/**
 * ArchitectJobStore — module-level singleton that survives React re-renders and
 * page navigation within the same browser tab.
 *
 * The generate stream runs here, not inside ArchitectClient, so navigating away
 * does not cancel the job. Listeners (React components) subscribe and unsubscribe.
 */

export type JobStatus = "idle" | "running" | "done" | "error"

export interface ArchitectJob {
  sessionId: string | null
  projectName: string
  status: JobStatus
  currentFile: string | null
  completedFiles: Record<string, string>
  failedFiles: string[]
  totalFiles: number
  error: string | null
  startedAt: number
}

type Listener = (job: ArchitectJob) => void

const DEFAULT_JOB: ArchitectJob = {
  sessionId: null,
  projectName: "",
  status: "idle",
  currentFile: null,
  completedFiles: {},
  failedFiles: [],
  totalFiles: 0,
  error: null,
  startedAt: 0,
}

let _job: ArchitectJob = { ...DEFAULT_JOB }
const _listeners = new Set<Listener>()

function notify() {
  const snapshot = { ..._job, completedFiles: { ..._job.completedFiles }, failedFiles: [..._job.failedFiles] }
  _listeners.forEach(fn => fn(snapshot))
}

export const ArchitectJobStore = {
  getJob(): ArchitectJob {
    return { ..._job, completedFiles: { ..._job.completedFiles }, failedFiles: [..._job.failedFiles] }
  },

  subscribe(fn: Listener): () => void {
    _listeners.add(fn)
    fn(ArchitectJobStore.getJob())
    return () => _listeners.delete(fn)
  },

  reset() {
    _job = { ...DEFAULT_JOB }
    notify()
  },

  async retryFiles(params: {
    messages: { role: string; content: string }[]
    summary: any
    sessionId: string | null
    filesToRetry: string[]
  }) {
    if (_job.status === "running") return
    const existing = { ..._job.completedFiles }
    _job = {
      ..._job,
      status: "running",
      currentFile: null,
      failedFiles: [],
      totalFiles: params.filesToRetry.length,
      error: null,
      startedAt: Date.now(),
    }
    notify()

    try {
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: params.messages,
          summary: params.summary,
          filesToGenerate: params.filesToRetry,
          sessionId: params.sessionId,
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const chunk = JSON.parse(line)
            if (chunk.type === "start") {
              _job.currentFile = chunk.filename
              notify()
            } else if (chunk.type === "file") {
              _job.completedFiles = { ...existing, ..._job.completedFiles, [chunk.filename]: chunk.content }
              notify()
            } else if (chunk.type === "done") {
              _job.status = "done"
              _job.currentFile = null
              _job.completedFiles = { ...existing, ...chunk.files }
              notify()
            } else if (chunk.type === "error") {
              console.error(`[ArchitectJob] retry error: ${chunk.filename}: ${chunk.message}`)
              if (chunk.filename && !_job.failedFiles.includes(chunk.filename)) {
                _job.failedFiles = [..._job.failedFiles, chunk.filename]
              }
              notify()
            }
          } catch { /* malformed line */ }
        }
      }

      if (_job.status !== "done") {
        _job.status = "done"
        _job.currentFile = null
        _job.completedFiles = { ...existing, ..._job.completedFiles }
        notify()
      }
    } catch (e) {
      _job.status = "error"
      _job.currentFile = null
      _job.error = e instanceof Error ? e.message : String(e)
      notify()
    }
  },

  async start(params: {
    messages: { role: string; content: string }[]
    summary: any
    filesToGenerate: string[]
    sessionId: string | null
  }) {
    if (_job.status === "running") return

    _job = {
      sessionId: params.sessionId,
      projectName: params.summary?.projectName ?? "Project",
      status: "running",
      currentFile: null,
      completedFiles: {},
      failedFiles: [],
      totalFiles: params.filesToGenerate?.length || 6,
      error: null,
      startedAt: Date.now(),
    }
    notify()

    try {
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const chunk = JSON.parse(line)
            if (chunk.type === "start") {
              _job.currentFile = chunk.filename
              notify()
            } else if (chunk.type === "file") {
              _job.completedFiles = { ..._job.completedFiles, [chunk.filename]: chunk.content }
              notify()
            } else if (chunk.type === "done") {
              _job.status = "done"
              _job.currentFile = null
              _job.completedFiles = chunk.files ?? _job.completedFiles
              notify()
            } else if (chunk.type === "error") {
              console.error(`[ArchitectJob] file error: ${chunk.filename}: ${chunk.message}`)
              if (chunk.filename && !_job.failedFiles.includes(chunk.filename)) {
                _job.failedFiles = [..._job.failedFiles, chunk.filename]
              }
              notify()
            }
          } catch { /* malformed line */ }
        }
      }

      if (_job.status !== "done") {
        _job.status = "done"
        _job.currentFile = null
        notify()
      }
    } catch (e) {
      _job.status = "error"
      _job.currentFile = null
      _job.error = e instanceof Error ? e.message : String(e)
      notify()
    }
  },
}
