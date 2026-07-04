"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorkflowCanvas } from "./WorkflowCanvas"
import { WorkflowList } from "./WorkflowList"
import { ExecutionHistory } from "./ExecutionHistory"
import { DirectoryOptimizer } from "./DirectoryOptimizer"
import { NodeLibrary } from "./NodeLibrary"
import { MidasBridge } from "./MidasBridge"
import { ArrowLeft, Loader2, X } from "lucide-react"
import type { NexusWorkflow, NexusNode, NexusDirectory, WorkflowExecution } from "@/lib/nexus/types"

interface CreateWorkflowModalProps {
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<void>
}

function CreateWorkflowModal({ onClose, onCreate }: CreateWorkflowModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim(), description.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">New Workflow</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/60 block mb-1.5">Name *</label>
            <Input
              autoFocus
              placeholder="My Workflow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60 block mb-1.5">Description</label>
            <textarea
              placeholder="What does this workflow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm px-3 py-2 outline-none focus:border-white/20 placeholder:text-white/30 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!name.trim() || loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

interface NexusClientProps {
  initialWorkflows: NexusWorkflow[]
  initialNodes: NexusNode[]
  initialDirectories: NexusDirectory[]
  initialExecutions: WorkflowExecution[]
}

export function NexusClient({ initialWorkflows, initialNodes, initialDirectories, initialExecutions }: NexusClientProps) {
  const [workflows, setWorkflows] = useState<NexusWorkflow[]>(initialWorkflows)
  const [nodes] = useState<NexusNode[]>(initialNodes)
  const [directories, setDirectories] = useState<NexusDirectory[]>(initialDirectories)
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialExecutions)
  const [activeWorkflow, setActiveWorkflow] = useState<NexusWorkflow | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [tab, setTab] = useState("workflows")

  // Refresh executions every 5s when one is running
  useEffect(() => {
    const running = executions.some((e) => e.status === "running" || e.status === "pending")
    if (!running) return
    const timer = setInterval(async () => {
      const res = await fetch("/api/nexus/executions")
      if (res.ok) {
        const data = await res.json()
        setExecutions(data.executions)
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [executions])

  const handleCreateWorkflow = useCallback(async (name: string, description: string) => {
    const res = await fetch("/api/nexus/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
    if (!res.ok) throw new Error("Failed to create workflow")
    const data = await res.json()
    setWorkflows((prev) => [data.workflow, ...prev])
    setShowCreate(false)
    setActiveWorkflow(data.workflow)
  }, [])

  const handleSaveWorkflow = useCallback(async (definition: NexusWorkflow["definition"]) => {
    if (!activeWorkflow) return
    setSaving(true)
    try {
      const res = await fetch(`/api/nexus/workflows/${activeWorkflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ definition }),
      })
      if (!res.ok) throw new Error("Save failed")
      const data = await res.json()
      setWorkflows((prev) => prev.map((w) => (w.id === data.workflow.id ? data.workflow : w)))
      setActiveWorkflow(data.workflow)
    } finally {
      setSaving(false)
    }
  }, [activeWorkflow])

  const handleExecuteWorkflow = useCallback(async (workflowId?: string) => {
    const id = workflowId ?? activeWorkflow?.id
    if (!id) return
    setExecuting(id)
    try {
      const res = await fetch(`/api/nexus/workflows/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Execution failed")
      const data = await res.json()
      setExecutions((prev) => [data.execution, ...prev])
      // Update workflow execution_count
      const wfRes = await fetch(`/api/nexus/workflows/${id}`)
      if (wfRes.ok) {
        const wfData = await wfRes.json()
        setWorkflows((prev) => prev.map((w) => (w.id === id ? wfData.workflow : w)))
        if (activeWorkflow?.id === id) setActiveWorkflow(wfData.workflow)
      }
    } finally {
      setExecuting(null)
    }
  }, [activeWorkflow])

  const handleDeleteWorkflow = useCallback(async (id: string) => {
    await fetch(`/api/nexus/workflows/${id}`, { method: "DELETE" })
    setWorkflows((prev) => prev.filter((w) => w.id !== id))
    if (activeWorkflow?.id === id) setActiveWorkflow(null)
  }, [activeWorkflow])

  const handleDeleteDirectory = useCallback(async (id: string) => {
    await fetch(`/api/nexus/directories/${id}`, { method: "DELETE" })
    setDirectories((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const refreshDirectories = useCallback(async () => {
    const res = await fetch("/api/nexus/directories")
    if (res.ok) {
      const data = await res.json()
      setDirectories(data.directories)
    }
  }, [])

  // ─── Workflow Editor View ───────────────────────────────────────────────────
  if (activeWorkflow) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setActiveWorkflow(null)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">{activeWorkflow.name}</h2>
            {activeWorkflow.description && (
              <p className="text-xs text-white/40">{activeWorkflow.description}</p>
            )}
          </div>
          <span className="text-xs text-white/30 capitalize">{activeWorkflow.status}</span>
        </div>
        <div className="flex-1 rounded-2xl border border-white/[0.06] overflow-hidden">
          <WorkflowCanvas
            workflow={activeWorkflow}
            availableNodes={nodes}
            onSave={handleSaveWorkflow}
            onExecute={() => handleExecuteWorkflow()}
            saving={saving}
            executing={executing === activeWorkflow.id}
          />
        </div>
      </div>
    )
  }

  // ─── Main Dashboard View ───────────────────────────────────────────────────
  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="bg-white/[0.02] border border-white/[0.06]">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">
            Executions
            {executions.filter((e) => e.status === "running").length > 0 && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 inline-block animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="directories">Directories</TabsTrigger>
          <TabsTrigger value="nodes">Node Library</TabsTrigger>
          <TabsTrigger value="bridge">Bridge</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <WorkflowList
            workflows={workflows}
            onOpen={setActiveWorkflow}
            onCreate={() => setShowCreate(true)}
            onDelete={handleDeleteWorkflow}
            onExecute={(id) => handleExecuteWorkflow(id)}
            executing={executing}
          />
        </TabsContent>

        <TabsContent value="executions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Execution History</h2>
              <span className="text-xs text-white/40">{executions.length} runs</span>
            </div>
            <ExecutionHistory executions={executions} />
          </div>
        </TabsContent>

        <TabsContent value="directories">
          <DirectoryOptimizer
            directories={directories}
            onRefresh={refreshDirectories}
            onDelete={handleDeleteDirectory}
          />
        </TabsContent>

        <TabsContent value="nodes">
          <NodeLibrary />
        </TabsContent>

        <TabsContent value="bridge">
          <MidasBridge />
        </TabsContent>
      </Tabs>

      {showCreate && (
        <CreateWorkflowModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateWorkflow}
        />
      )}
    </>
  )
}
