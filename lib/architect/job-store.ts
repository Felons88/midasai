"use client";

export interface ArchitectJob {
  id: string;
  jobId: string;
  sessionId: string;
  projectName: string;
  status: "idle" | "running" | "done" | "error";
  currentFile: string | null;
  currentStep: string;
  fileQueue: Array<{ name: string; status: "pending" | "processing" | "completed" | "failed" }>;
  completedFiles: Record<string, string>;
  failedFiles: string[];
  totalFiles: number;
  error: string | null;
  createdAt: number;
  startedAt: number;
  completedAt: number | null;
  progress: number;
}

const STORAGE_KEY = "architect-job-state";

const DEFAULT_JOB: ArchitectJob = {
  id: "",
  jobId: "",
  sessionId: "",
  projectName: "",
  status: "idle",
  currentFile: null,
  currentStep: "idle",
  fileQueue: [],
  completedFiles: {},
  failedFiles: [],
  totalFiles: 0,
  error: null,
  createdAt: 0,
  startedAt: 0,
  completedAt: null,
  progress: 0,
};

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function loadJob(): ArchitectJob {
  if (typeof window === "undefined") return { ...DEFAULT_JOB };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_JOB };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_JOB, ...parsed };
  } catch {
    return { ...DEFAULT_JOB };
  }
}

function persistJob() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_job));
  } catch {
    /* ignore */
  }
}

let _job: ArchitectJob = loadJob();
const _subscribers = new Set<(job: ArchitectJob) => void>();

function getJobSnapshot(): ArchitectJob {
  return {
    ..._job,
    completedFiles: { ..._job.completedFiles },
    failedFiles: [..._job.failedFiles],
    fileQueue: _job.fileQueue.map((f) => ({ ...f })),
  };
}

function notify() {
  const snapshot = getJobSnapshot();
  _subscribers.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (e) {
      console.error("[ArchitectJobStore] subscriber error:", e);
    }
  });
}

function setJob(update: Partial<ArchitectJob>) {
  _job = { ..._job, ...update };
  persistJob();
  notify();
}

function handleStreamEvent(event: any, jobId: string) {
  if (_job.jobId !== jobId) return;

  if (event.type === "start" && event.filename) {
    setJob({
      currentFile: event.filename,
      currentStep: "generating",
      fileQueue: _job.fileQueue.map((f) =>
        f.name === event.filename ? { ...f, status: "processing" } : f
      ),
    });
    return;
  }

  if (event.type === "file" && event.filename) {
    const completedFiles = { ..._job.completedFiles, [event.filename]: event.content };
    const completedCount = Object.keys(completedFiles).length;
    setJob({
      currentFile: null,
      currentStep: "completed",
      completedFiles,
      fileQueue: _job.fileQueue.map((f) =>
        f.name === event.filename ? { ...f, status: "completed" } : f
      ),
      progress: _job.totalFiles > 0 ? Math.round((completedCount / _job.totalFiles) * 100) : 0,
    });
    return;
  }

  if (event.type === "error" && event.filename) {
    setJob({
      currentFile: null,
      currentStep: "error",
      failedFiles: [..._job.failedFiles, event.filename],
      fileQueue: _job.fileQueue.map((f) =>
        f.name === event.filename ? { ...f, status: "failed" } : f
      ),
      error: event.message || `Failed to generate ${event.filename}`,
    });
    return;
  }
}

async function processStream(response: Response, jobId: string) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        handleStreamEvent(event, jobId);
      } catch (e) {
        console.error("[ArchitectJobStore] Failed to parse stream line:", line, e);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      handleStreamEvent(event, jobId);
    } catch {
      /* ignore trailing partial line */
    }
  }
}

export const ArchitectJobStore = {
  getJob(): ArchitectJob {
    return getJobSnapshot();
  },

  subscribe(fn: (job: ArchitectJob) => void): () => void {
    _subscribers.add(fn);
    fn(getJobSnapshot());
    return () => _subscribers.delete(fn);
  },

  reset() {
    _job = { ...DEFAULT_JOB };
    persistJob();
    notify();
  },

  async start(params: {
    messages: Array<{ role: string; content: string }>;
    summary: { projectName?: string; filesToGenerate?: string[]; [key: string]: any };
    filesToGenerate: string[];
    sessionId: string | null;
  }) {
    if (_job.status === "running") return;

    const files = params.filesToGenerate?.length
      ? params.filesToGenerate
      : params.summary?.filesToGenerate ?? [];
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    _job = {
      ...DEFAULT_JOB,
      id: generateId(),
      jobId,
      sessionId: params.sessionId || "",
      projectName: params.summary?.projectName || "Untitled Project",
      status: "running",
      currentStep: "initializing",
      fileQueue: files.map((name) => ({ name, status: "pending" as const })),
      totalFiles: files.length,
      createdAt: Date.now(),
      startedAt: Date.now(),
    };
    persistJob();
    notify();

    try {
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: params.messages,
          summary: params.summary,
          filesToGenerate: files,
          sessionId: params.sessionId,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Generation failed: ${res.status} ${text}`);
      }

      await processStream(res, jobId);

      if (_job.jobId === jobId) {
        const completedCount = Object.keys(_job.completedFiles).length;
        setJob({
          status: completedCount > 0 ? "done" : "error",
          currentFile: null,
          currentStep: completedCount > 0 ? "done" : "error",
          completedAt: Date.now(),
          progress: completedCount > 0 ? 100 : _job.progress,
          error: completedCount > 0 ? null : _job.error || "No files were generated",
        });
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      if (_job.jobId === jobId) {
        setJob({
          status: "error",
          error,
          currentFile: null,
          currentStep: "error",
          completedAt: Date.now(),
        });
      }
    }
  },

  async retryFiles(params: {
    filesToRetry: string[];
    summary: { projectName?: string; [key: string]: any };
    messages: Array<{ role: string; content: string }>;
    sessionId: string | null;
  }) {
    if (_job.status === "running") return;

    const existingFiles = { ..._job.completedFiles };
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    _job = {
      ..._job,
      id: generateId(),
      jobId,
      sessionId: params.sessionId || _job.sessionId,
      projectName: params.summary?.projectName || _job.projectName,
      status: "running",
      currentStep: "retrying",
      fileQueue: params.filesToRetry.map((name) => ({ name, status: "pending" as const })),
      completedFiles: existingFiles,
      failedFiles: [],
      totalFiles: params.filesToRetry.length,
      error: null,
      startedAt: Date.now(),
      completedAt: null,
    };
    persistJob();
    notify();

    try {
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: params.messages,
          summary: params.summary,
          filesToGenerate: params.filesToRetry,
          sessionId: params.sessionId || _job.sessionId,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Retry failed: ${res.status} ${text}`);
      }

      await processStream(res, jobId);

      if (_job.jobId === jobId) {
        setJob({
          status: "done",
          currentFile: null,
          currentStep: "done",
          completedAt: Date.now(),
          progress: 100,
        });
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      if (_job.jobId === jobId) {
        setJob({
          status: "error",
          error,
          currentFile: null,
          currentStep: "error",
          completedAt: Date.now(),
        });
      }
    }
  },
};
