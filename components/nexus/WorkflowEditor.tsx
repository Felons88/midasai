"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Trash2, Copy, GitBranch, X, Rocket, Sparkles, Package, Upload, Globe,
  Keyboard, Map, MousePointer2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getNodeById, type NodeDefinition, type NodePort } from "@/lib/nexus/node-registry"
import { getIntegration, CREDENTIAL_TO_INTEGRATION } from "@/lib/nexus/integration-registry"
import { BrandIcon } from "./BrandIcon"
import { NodeSidebar } from "./NodeSidebar"
import { NodeConfigPanel, type NodeConfigValues, type ValidationState } from "./NodeConfigPanel"
import { NodeAuthPopup, getMissingIntegrations } from "./NodeAuthPopup"
import type { NexusWorkflow, WorkflowDefinition } from "@/lib/nexus/types"

// Canvas node instance
interface CanvasNode {
  id: string
  definitionId: string
  position: { x: number; y: number }
  config: NodeConfigValues
  label?: string
  status?: "idle" | "running" | "success" | "error"
  output?: Record<string, unknown>
}

// Canvas edge
interface CanvasEdge {
  id: string
  sourceNodeId: string
  sourcePort: string
  targetNodeId: string
  targetPort: string
}

// Undo/redo history entry
interface HistoryEntry {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// Port coordinates helper (used for edge drawing)
function portPos(node: CanvasNode, portId: string, side: "input" | "output", def: NodeDefinition) {
  const ports = side === "input" ? def.inputs : def.outputs
  const idx = ports.findIndex(p => p.id === portId)
  const x = side === "input" ? node.position.x : node.position.x + NODE_WIDTH
  const y = node.position.y + NODE_HEADER_H + idx * PORT_ROW_H + PORT_ROW_H / 2
  return { x, y }
}

const NODE_WIDTH = 220
const NODE_HEADER_H = 44
const PORT_ROW_H = 22

interface WorkflowEditorProps {
  workflow: NexusWorkflow
  onBack: () => void
  onSave: (definition: WorkflowDefinition) => Promise<void>
  onExecute: () => Promise<void>
}

const GRID_SIZE = 20
const MIN_ZOOM = 0.2
const MAX_ZOOM = 2.5

function snapToGrid(v: number) { return Math.round(v / GRID_SIZE) * GRID_SIZE }
function uid() { return Math.random().toString(36).slice(2, 9) }

// ─── Deploy pipeline stages ──────────────────────────────────────────────────
const DEPLOY_STAGES = [
  { id: "validate", label: "Validating workflow", icon: CheckCircle2, color: "text-violet-400" },
  { id: "build", label: "Building node graph", icon: Package, color: "text-blue-400" },
  { id: "bundle", label: "Bundling assets", icon: Upload, color: "text-cyan-400" },
  { id: "deploy", label: "Deploying to edge", icon: Globe, color: "text-emerald-400" },
  { id: "done", label: "Live and running", icon: Sparkles, color: "text-amber-400" },
]

function DeployAnimationModal({ workflowName, onClose }: { workflowName: string; onClose: () => void }) {
  const [stageIdx, setStageIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timings = [800, 1200, 1000, 1400, 600]
    let idx = 0
    const advance = () => {
      idx++
      setStageIdx(idx)
      if (idx >= DEPLOY_STAGES.length - 1) {
        setTimeout(() => setDone(true), 400)
        return
      }
      setTimeout(advance, timings[idx] ?? 800)
    }
    const t = setTimeout(advance, timings[0])
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
      <div className="w-[440px] rounded-2xl border border-white/[0.08] bg-[#0a0a12] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-white/[0.05]">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-500/20 mb-3">
            <Rocket className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Deploying Workflow</h3>
          <p className="text-xs text-white/40 mt-1 truncate">&#34;{workflowName}&#34;</p>
        </div>

        {/* Pipeline stages */}
        <div className="px-6 py-5 space-y-3">
          {DEPLOY_STAGES.map((stage, i) => {
            const Icon = stage.icon
            const isActive = i === stageIdx && !done
            const isComplete = i < stageIdx || done
            const isPending = i > stageIdx && !done
            return (
              <div key={stage.id} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-500",
                isActive ? "bg-white/[0.06] border border-white/[0.1]" :
                isComplete ? "opacity-60" : "opacity-20"
              )}>
                <div className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                  isComplete ? "bg-emerald-500/20" : isActive ? "bg-violet-500/20" : "bg-white/[0.04]"
                )}>
                  {isActive && !done && <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />}
                  {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  {isPending && <Icon className={cn("h-3.5 w-3.5", stage.color)} />}
                </div>
                <span className={cn(
                  "text-sm transition-colors",
                  isActive ? "text-white font-medium" : isComplete ? "text-white/50" : "text-white/20"
                )}>{stage.label}</span>
                {isActive && (
                  <div className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map(d => (
                      <div key={d} className="h-1 w-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d * 100}ms` }} />
                    ))}
                  </div>
                )}
                {isComplete && <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-auto" />}
              </div>
            )
          })}
        </div>

        {/* Done state */}
        {done && (
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center mb-4">
              <p className="text-sm font-semibold text-emerald-400">Workflow deployed successfully</p>
              <p className="text-xs text-emerald-300/60 mt-0.5">Your workflow is now live on the edge network</p>
            </div>
            <button
              onClick={onClose}
              className="w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function WorkflowEditor({ workflow, onBack, onSave, onExecute }: WorkflowEditorProps) {
  // Parse existing definition
  const initNodes = (): CanvasNode[] => {
    return (workflow.definition?.nodes ?? []).map(n => ({
      id: n.id,
      definitionId: n.node_type_id,
      position: n.position,
      config: (n.configuration ?? {}) as NodeConfigValues,
      label: n.label,
      status: "idle",
    }))
  }
  const initEdges = (): CanvasEdge[] => {
    return (workflow.definition?.edges ?? []).map(e => ({
      id: e.id,
      sourceNodeId: e.source_node_id,
      sourcePort: String(e.source_output),
      targetNodeId: e.target_node_id,
      targetPort: String(e.target_input),
    }))
  }

  const [nodes, setNodes] = useState<CanvasNode[]>(initNodes)
  const [edges, setEdges] = useState<CanvasEdge[]>(initEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle")
  const [execError, setExecError] = useState<string | null>(null)
  const [showDeploy, setShowDeploy] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const selectionStart = useRef<{ x: number; y: number } | null>(null)
  // Pending auth popup — queued node awaiting connection
  const [pendingAuth, setPendingAuth] = useState<{
    def: NodeDefinition
    pos: { x: number; y: number }
    screenX: number
    screenY: number
    integrationId: string
  } | null>(null)
  // Undo/redo
  const history = useRef<HistoryEntry[]>([])
  const historyIdx = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  // Drag/pan state
  const isDraggingCanvas = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const draggingNodeId = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  // Edge drawing from output port
  const drawingEdge = useRef<{ sourceNodeId: string; sourcePort: string; x1: number; y1: number } | null>(null)
  const [ghostEdge, setGhostEdge] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [highlightPort, setHighlightPort] = useState<{ nodeId: string; portId: string } | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null
  const selectedDef = selectedNode ? getNodeById(selectedNode.definitionId) : null

  // ─── History helpers ─────────────────────────────────────────────────────────
  const pushHistory = useCallback((n: CanvasNode[], e: CanvasEdge[]) => {
    const entry: HistoryEntry = { nodes: JSON.parse(JSON.stringify(n)), edges: JSON.parse(JSON.stringify(e)) }
    const truncated = history.current.slice(0, historyIdx.current + 1)
    truncated.push(entry)
    history.current = truncated.slice(-50) // keep 50 steps
    historyIdx.current = history.current.length - 1
    setCanUndo(historyIdx.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return
    historyIdx.current--
    const entry = history.current[historyIdx.current]
    setNodes(entry.nodes)
    setEdges(entry.edges)
    setCanUndo(historyIdx.current > 0)
    setCanRedo(true)
  }, [])

  const redo = useCallback(() => {
    if (historyIdx.current >= history.current.length - 1) return
    historyIdx.current++
    const entry = history.current[historyIdx.current]
    setNodes(entry.nodes)
    setEdges(entry.edges)
    setCanUndo(true)
    setCanRedo(historyIdx.current < history.current.length - 1)
  }, [])

  // Initialize history on mount
  useEffect(() => { pushHistory(initNodes(), initEdges()) }, [])

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave() }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo() }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault()
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId)
          if (node) {
            const copy: CanvasNode = { ...JSON.parse(JSON.stringify(node)), id: uid(), position: { x: node.position.x + 40, y: node.position.y + 40 } }
            const next = [...nodes, copy]
            setNodes(next)
            setSelectedNodeId(copy.id)
            pushHistory(next, edges)
          }
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeIds.size > 0) {
          selectedNodeIds.forEach(id => deleteNode(id))
          setSelectedNodeIds(new Set())
        } else if (selectedNodeId) {
          deleteNode(selectedNodeId)
        }
      }
      if (e.key === "Escape") { setSelectedNodeId(null); setRenamingNodeId(null); setSelectedNodeIds(new Set()); setSelectionBox(null) }
      if (e.key === "?") { e.preventDefault(); setShowShortcuts(prev => !prev) }
      if (e.key === "m" && !e.metaKey && !e.ctrlKey) { setShowMinimap(prev => !prev) }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") { e.preventDefault(); setSelectedNodeIds(new Set(nodes.map(n => n.id))) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedNodeId, selectedNodeIds, nodes, edges])

  // ─── Add node (internal — no auth check) ───────────────────────────────────
  const placeNode = useCallback((def: NodeDefinition, pos?: { x: number; y: number }) => {
    const centerX = (-pan.x + (canvasRef.current?.clientWidth ?? 800) / 2) / zoom
    const centerY = (-pan.y + (canvasRef.current?.clientHeight ?? 600) / 2) / zoom
    const position = pos ?? { x: snapToGrid(centerX - 100), y: snapToGrid(centerY - 40) }
    const defaults: NodeConfigValues = {}
    for (const f of def.fields) { if (f.default !== undefined) defaults[f.key] = f.default }
    const newNode: CanvasNode = {
      id: uid(),
      definitionId: def.id,
      position,
      config: defaults,
      status: "idle",
    }
    setNodes(prev => {
      const next = [...prev, newNode]
      pushHistory(next, edges)
      return next
    })
    setSelectedNodeId(newNode.id)
  }, [pan, zoom, edges, pushHistory])

  // ─── Add node — with auth check ───────────────────────────────────────────
  const addNodeFromDef = useCallback(async (def: NodeDefinition, pos?: { x: number; y: number }, screenPos?: { x: number; y: number }) => {
    const creds = def.credentials ?? []
    if (creds.length > 0) {
      const missing = await getMissingIntegrations(creds)
      if (missing.length > 0) {
        const integrationId = CREDENTIAL_TO_INTEGRATION[missing[0]] ?? missing[0]
        const integration = getIntegration(integrationId)
        if (integration) {
          const centerX = (-pan.x + (canvasRef.current?.clientWidth ?? 800) / 2) / zoom
          const centerY = (-pan.y + (canvasRef.current?.clientHeight ?? 600) / 2) / zoom
          const position = pos ?? { x: snapToGrid(centerX - 100), y: snapToGrid(centerY - 40) }
          const rect = canvasRef.current?.getBoundingClientRect()
          const sx = screenPos?.x ?? (rect ? rect.left + rect.width / 2 : window.innerWidth / 2)
          const sy = screenPos?.y ?? (rect ? rect.top + rect.height / 2 : window.innerHeight / 2)
          setPendingAuth({ def, pos: position, screenX: sx, screenY: sy, integrationId })
          return
        }
      }
    }
    placeNode(def, pos)
  }, [pan, zoom, placeNode])

  const handleSidebarAdd = useCallback((def: NodeDefinition) => { addNodeFromDef(def) }, [addNodeFromDef])

  const handleSidebarDragStart = useCallback((def: NodeDefinition, e: React.DragEvent) => {
    e.dataTransfer.setData("nodeId", def.id)
  }, [])

  // ─── Canvas drop ─────────────────────────────────────────────────────────────
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const defId = e.dataTransfer.getData("nodeId")
    if (!defId) return
    const def = getNodeById(defId)
    if (!def) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = snapToGrid((e.clientX - rect.left - pan.x) / zoom)
    const y = snapToGrid((e.clientY - rect.top - pan.y) / zoom)
    addNodeFromDef(def, { x, y }, { x: e.clientX, y: e.clientY })
  }, [pan, zoom, addNodeFromDef])

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const deleteNode = useCallback((id: string) => {
    setNodes(prev => {
      const nextN = prev.filter(n => n.id !== id)
      setEdges(prevE => {
        const nextE = prevE.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id)
        pushHistory(nextN, nextE)
        return nextE
      })
      return nextN
    })
    setSelectedNodeId(null)
  }, [pushHistory])

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(prev => {
      const next = prev.filter(e => e.id !== edgeId)
      pushHistory(nodes, next)
      return next
    })
  }, [nodes, pushHistory])

  // ─── Config change ───────────────────────────────────────────────────────────
  const updateNodeConfig = useCallback((nodeId: string, key: string, value: unknown) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n))
    // Don't push to undo history on every keystroke — save does it
  }, [])

  // ─── Rename ──────────────────────────────────────────────────────────────────
  const startRename = useCallback((node: CanvasNode, def: NodeDefinition) => {
    setRenamingNodeId(node.id)
    setRenameValue(node.label ?? def.name)
    setTimeout(() => renameInputRef.current?.select(), 30)
  }, [])

  const commitRename = useCallback(() => {
    if (!renamingNodeId) return
    setNodes(prev => {
      const next = prev.map(n => n.id === renamingNodeId ? { ...n, label: renameValue.trim() || undefined } : n)
      pushHistory(next, edges)
      return next
    })
    setRenamingNodeId(null)
  }, [renamingNodeId, renameValue, edges, pushHistory])

  // ─── Canvas pan ──────────────────────────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isDraggingCanvas.current = true
      lastPanPos.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingCanvas.current) {
      setPan(prev => ({ x: prev.x + (e.clientX - lastPanPos.current.x), y: prev.y + (e.clientY - lastPanPos.current.y) }))
      lastPanPos.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (draggingNodeId.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = snapToGrid((e.clientX - rect.left - pan.x) / zoom - dragOffset.current.x)
      const y = snapToGrid((e.clientY - rect.top - pan.y) / zoom - dragOffset.current.y)
      setNodes(prev => prev.map(n => n.id === draggingNodeId.current ? { ...n, position: { x, y } } : n))
    }
    if (drawingEdge.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x2 = (e.clientX - rect.left - pan.x) / zoom
      const y2 = (e.clientY - rect.top - pan.y) / zoom
      setGhostEdge({ x1: drawingEdge.current.x1, y1: drawingEdge.current.y1, x2, y2 })
    }
  }, [pan, zoom])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // If we were drawing an edge and released over a port, the port handler fires first via onMouseUp on the port div.
    // Just clean up here.
    if (draggingNodeId.current) {
      // Push history after node drag ends
      pushHistory(nodes, edges)
    }
    isDraggingCanvas.current = false
    draggingNodeId.current = null
    drawingEdge.current = null
    setGhostEdge(null)
    setHighlightPort(null)
  }, [nodes, edges, pushHistory])

  // ─── Edge drawing port handlers ──────────────────────────────────────────────
  const startEdge = useCallback((nodeId: string, portId: string, x1: number, y1: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    drawingEdge.current = { sourceNodeId: nodeId, sourcePort: portId, x1, y1 }
    setGhostEdge({ x1, y1, x2: x1, y2: y1 })
  }, [])

  const commitEdge = useCallback((targetNodeId: string, targetPortId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const src = drawingEdge.current
    if (!src) return
    drawingEdge.current = null
    setGhostEdge(null)
    setHighlightPort(null)
    if (src.sourceNodeId === targetNodeId) return
    // Prevent duplicate edges on same ports
    const exists = edges.some(edge => edge.sourceNodeId === src.sourceNodeId && edge.sourcePort === src.sourcePort && edge.targetNodeId === targetNodeId && edge.targetPort === targetPortId)
    if (exists) return
    const newEdge: CanvasEdge = { id: uid(), sourceNodeId: src.sourceNodeId, sourcePort: src.sourcePort, targetNodeId, targetPort: targetPortId }
    setEdges(prev => {
      const next = [...prev, newEdge]
      pushHistory(nodes, next)
      return next
    })
  }, [edges, nodes, pushHistory])

  // ─── Zoom ─────────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)))
  }, [])

  const zoomIn = () => setZoom(z => Math.min(MAX_ZOOM, z * 1.2))
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z / 1.2))
  const fitView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const definition: WorkflowDefinition = {
        nodes: nodes.map(n => ({
          id: n.id,
          node_type_id: n.definitionId,
          position: n.position,
          configuration: n.config,
          label: n.label,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source_node_id: e.sourceNodeId,
          source_output: e.sourcePort,
          target_node_id: e.targetNodeId,
          target_input: e.targetPort,
        })),
      }
      await onSave(definition)
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    } finally {
      setSaving(false)
    }
  }, [nodes, edges, onSave])

  // ─── Validation gate ─────────────────────────────────────────────────────────
  const getValidationErrors = useCallback(() => {
    const errors: string[] = []
    for (const node of nodes) {
      const def = getNodeById(node.definitionId)
      if (!def) continue
      const missing = def.fields.filter(f => f.required && (node.config[f.key] === undefined || node.config[f.key] === ""))
      if (missing.length > 0) errors.push(`${node.label ?? def.name}: missing ${missing.map(f => f.label).join(", ")}`)
    }
    return errors
  }, [nodes])

  const handleExecute = async () => {
    setExecError(null)
    const errors = getValidationErrors()
    if (errors.length > 0) {
      setExecError(`Fix ${errors.length} error${errors.length > 1 ? "s" : ""} before running:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n…and ${errors.length - 3} more` : ""}`)
      return
    }
    if (nodes.length === 0) { setExecError("Add at least one node before running."); return }
    // Animate: set all nodes to idle, then run through them sequentially
    setNodes(prev => prev.map(n => ({ ...n, status: "idle", output: undefined })))
    setExecuting(true)
    try {
      await onExecute()
    } catch (err) {
      setExecError(err instanceof Error ? err.message : "Execution failed")
    } finally {
      setExecuting(false)
    }
  }

  // ─── Per-node validation ──────────────────────────────────────────────────────
  const validateNode = useCallback((node: CanvasNode, def: NodeDefinition): { state: ValidationState; message: string } => {
    const missing = def.fields.filter(f => f.required && (node.config[f.key] === undefined || node.config[f.key] === ""))
    if (missing.length > 0) return { state: "error", message: `Required: ${missing.map(f => f.label).join(", ")}` }
    return { state: "valid", message: "Configuration is valid" }
  }, [])

  // ─── Edge bezier path ─────────────────────────────────────────────────────────
  const edgePath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(60, Math.abs(x2 - x1) * 0.45)
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
  }

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0 bg-[#080810] z-50 overflow-hidden">
      {/* ─── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-white/[0.06] bg-[#08080f] flex-shrink-0 z-10">
        <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-white/[0.08]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{workflow.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarBtn onClick={undo} title="Undo (Ctrl+Z)" disabled={!canUndo}><Undo2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={redo} title="Redo (Ctrl+Y)" disabled={!canRedo}><Redo2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <div className="h-4 w-px bg-white/[0.08] mx-1" />
          <ToolbarBtn onClick={zoomOut} title="Zoom Out"><ZoomOut className="h-3.5 w-3.5" /></ToolbarBtn>
          <span className="text-xs text-white/30 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <ToolbarBtn onClick={zoomIn} title="Zoom In"><ZoomIn className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={fitView} title="Fit View"><Maximize2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => setShowMinimap(p => !p)} title={showMinimap ? "Hide Minimap (M)" : "Show Minimap (M)"}>
            <Map className={cn("h-3.5 w-3.5", showMinimap ? "text-violet-400" : "")} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts (?)">
            <Keyboard className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <div className="h-4 w-px bg-white/[0.08] mx-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all",
              saveState === "saved" ? "bg-emerald-500/20 text-emerald-300" :
              saveState === "error" ? "bg-red-500/20 text-red-300" :
              "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
             saveState === "saved" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
             saveState === "error" ? <AlertCircle className="h-3.5 w-3.5" /> :
             <Save className="h-3.5 w-3.5" />}
            {saveState === "saved" ? "Saved" : saveState === "error" ? "Error" : "Save"}
          </button>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Running…" : "Run"}
          </button>
          <button
            onClick={() => setShowDeploy(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
          >
            <Rocket className="h-3.5 w-3.5" />
            Deploy
          </button>
        </div>
      </div>

      {/* ─── Deploy animation modal ──────────────────────────────────────────── */}
      {showDeploy && (
        <DeployAnimationModal workflowName={workflow.name} onClose={() => setShowDeploy(false)} />
      )}

      {/* ─── Keyboard shortcuts modal ─────────────────────────────────────────── */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* ─── Node auth popup ─────────────────────────────────────────────────── */}
      {pendingAuth && (() => {
        const integration = getIntegration(pendingAuth.integrationId)
        if (!integration) return null
        return (
          <NodeAuthPopup
            screenX={pendingAuth.screenX}
            screenY={pendingAuth.screenY}
            integration={integration}
            onComplete={() => {
              placeNode(pendingAuth.def, pendingAuth.pos)
              setPendingAuth(null)
            }}
            onCancel={() => setPendingAuth(null)}
          />
        )
      })()}

      {/* ─── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <NodeSidebar onDragStart={handleSidebarDragStart} onAddNode={handleSidebarAdd} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-default"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={e => { handleMouseUp(e); drawingEdge.current = null; setGhostEdge(null) }}
          onWheel={handleWheel}
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onClick={e => { if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]")) { setSelectedNodeId(null); setSelectedNodeIds(new Set()) } }}
        >
          {/* Grid background */}
          <CanvasGrid zoom={zoom} pan={pan} />

          {/* Transformed layer */}
          <div
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}
          >
            {/* SVG edges — pointer-events enabled so we can delete on hover */}
            <svg style={{ position: "absolute", left: 0, top: 0, width: "10000px", height: "10000px", overflow: "visible", pointerEvents: "none" }}>
              {edges.map(edge => {
                const srcNode = nodes.find(n => n.id === edge.sourceNodeId)
                const tgtNode = nodes.find(n => n.id === edge.targetNodeId)
                if (!srcNode || !tgtNode) return null
                const srcDef = getNodeById(srcNode.definitionId)
                const tgtDef = getNodeById(tgtNode.definitionId)
                if (!srcDef || !tgtDef) return null
                const sp = portPos(srcNode, edge.sourcePort, "output", srcDef)
                const tp = portPos(tgtNode, edge.targetPort, "input", tgtDef)
                const isRunning = srcNode.status === "running" || tgtNode.status === "running"
                return (
                  <g key={edge.id} style={{ pointerEvents: "all" }}>
                    {/* Wide invisible hit area */}
                    <path d={edgePath(sp.x, sp.y, tp.x, tp.y)} fill="none" stroke="transparent" strokeWidth={12}
                      className="cursor-pointer"
                      onClick={e => { e.stopPropagation(); deleteEdge(edge.id) }}
                    />
                    <path
                      d={edgePath(sp.x, sp.y, tp.x, tp.y)}
                      fill="none"
                      stroke={isRunning ? "rgba(245,158,11,0.7)" : "rgba(139,92,246,0.55)"}
                      strokeWidth={1.5}
                      className="pointer-events-none"
                      style={isRunning ? { strokeDasharray: "8 4", animation: "dash 0.8s linear infinite" } : undefined}
                    />
                  </g>
                )
              })}
              {ghostEdge && (
                <path d={edgePath(ghostEdge.x1, ghostEdge.y1, ghostEdge.x2, ghostEdge.y2)} fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth={1.5} strokeDasharray="5 3" className="pointer-events-none" />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const def = getNodeById(node.definitionId)
              if (!def) return null
              const isSelected = node.id === selectedNodeId
              const isRenaming = node.id === renamingNodeId
              return (
                <CanvasNodeCard
                  key={node.id}
                  node={node}
                  def={def}
                  isSelected={isSelected}
                  isRenaming={isRenaming}
                  renameValue={renameValue}
                  renameInputRef={renameInputRef}
                  highlightPort={highlightPort}
                  onRenameChange={setRenameValue}
                  onRenameCommit={commitRename}
                  onDoubleClick={() => startRename(node, def)}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest("[data-port]")) return
                    e.stopPropagation()
                    setSelectedNodeId(node.id)
                    if (isRenaming) return
                    draggingNodeId.current = node.id
                    const canvasRect = canvasRef.current?.getBoundingClientRect()
                    if (canvasRect) {
                      dragOffset.current = {
                        x: (e.clientX - canvasRect.left - pan.x) / zoom - node.position.x,
                        y: (e.clientY - canvasRect.top - pan.y) / zoom - node.position.y,
                      }
                    }
                  }}
                  onDelete={() => deleteNode(node.id)}
                  onDuplicate={() => {
                    const copy: CanvasNode = { ...JSON.parse(JSON.stringify(node)), id: uid(), position: { x: node.position.x + 40, y: node.position.y + 40 } }
                    setNodes(prev => { const next = [...prev, copy]; pushHistory(next, edges); return next })
                    setSelectedNodeId(copy.id)
                  }}
                  onOutputPortMouseDown={(portId, x, y, e) => startEdge(node.id, portId, x, y, e)}
                  onInputPortMouseUp={(portId, e) => commitEdge(node.id, portId, e)}
                  onInputPortMouseEnter={(portId) => setHighlightPort({ nodeId: node.id, portId })}
                  onInputPortMouseLeave={() => setHighlightPort(null)}
                />
              )
            })}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div data-canvas-bg style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div className="text-center">
                  <GitBranch className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-sm text-white/20">Drag nodes from the left sidebar</p>
                  <p className="text-xs text-white/10 mt-1">or press / to search</p>
                </div>
              </div>
            )}
          </div>

          {/* Exec error toast */}
          {execError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-sm w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 flex-1 whitespace-pre-line">{execError}</p>
                <button onClick={() => setExecError(null)} className="text-red-400/60 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
          {/* Selection box */}
          {selectionBox && (
            <div style={{ position: "absolute", left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: "1px solid rgba(139,92,246,0.6)", background: "rgba(139,92,246,0.08)", pointerEvents: "none", zIndex: 20 }} />
          )}

          {/* Minimap */}
          {showMinimap && (
            <CanvasMinimap nodes={nodes} pan={pan} zoom={zoom} canvasRef={canvasRef} />
          )}

          {/* Node count badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-white/20 pointer-events-none">
            <span>{nodes.length} nodes</span>
            <span>·</span>
            <span>{edges.length} connections</span>
            <span>·</span>
            <span>{selectedNodeIds.size > 0 ? `${selectedNodeIds.size} selected` : getValidationErrors().length === 0 ? "✓ valid" : `${getValidationErrors().length} errors`}</span>
          </div>
        </div>

        {/* Right config panel */}
        {selectedNode && selectedDef && (
          <NodeConfigPanel
            node={selectedDef}
            values={selectedNode.config}
            onChange={(k, v) => updateNodeConfig(selectedNode.id, k, v)}
            onClose={() => setSelectedNodeId(null)}
            {...validateNode(selectedNode, selectedDef)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarBtn({ children, onClick, title, disabled }: { children: React.ReactNode; onClick: () => void; title?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="h-8 w-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors disabled:opacity-25 disabled:pointer-events-none"
    >
      {children}
    </button>
  )
}

// ─── Canvas grid ──────────────────────────────────────────────────────────────
function CanvasGrid({ zoom, pan }: { zoom: number; pan: { x: number; y: number } }) {
  const gridSize = GRID_SIZE * zoom
  const offsetX = pan.x % gridSize
  const offsetY = pan.y % gridSize
  return (
    <div
      data-canvas-bg
      className="absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  )
}

// ─── Canvas node card ─────────────────────────────────────────────────────────
interface CanvasNodeCardProps {
  node: CanvasNode
  def: NodeDefinition
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  highlightPort: { nodeId: string; portId: string } | null
  onRenameChange: (v: string) => void
  onRenameCommit: () => void
  onDoubleClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onDelete: () => void
  onDuplicate: () => void
  onOutputPortMouseDown: (portId: string, x: number, y: number, e: React.MouseEvent) => void
  onInputPortMouseUp: (portId: string, e: React.MouseEvent) => void
  onInputPortMouseEnter: (portId: string) => void
  onInputPortMouseLeave: () => void
}

function CanvasNodeCard({
  node, def, isSelected, isRenaming, renameValue, renameInputRef, highlightPort,
  onRenameChange, onRenameCommit, onDoubleClick,
  onMouseDown, onDelete, onDuplicate,
  onOutputPortMouseDown, onInputPortMouseUp, onInputPortMouseEnter, onInputPortMouseLeave,
}: CanvasNodeCardProps) {
  const statusBorder = { idle: "", running: "border-amber-500/60", success: "border-emerald-500/60", error: "border-red-500/60" }[node.status ?? "idle"]

  return (
    <div
      style={{ position: "absolute", left: node.position.x, top: node.position.y, width: NODE_WIDTH, userSelect: "none" }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "rounded-xl border bg-[#0f0f1a] shadow-xl cursor-grab active:cursor-grabbing group",
        isSelected ? "border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.12)]" : "border-white/[0.08] hover:border-white/[0.16]",
        statusBorder && !isSelected ? statusBorder : "",
        node.status === "running" ? "shadow-amber-500/10" : "",
      )}
    >
      {/* Node header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.06]">
        <div
          className="h-7 w-7 flex-shrink-0 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: def.color + "20", color: def.color }}
        >
          {def.icon.length === 1 ? <span style={{ fontSize: 13 }}>{def.icon}</span> : <BrandIcon brand={def.icon} size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef as React.RefObject<HTMLInputElement>}
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onBlur={onRenameCommit}
              onKeyDown={e => { if (e.key === "Enter") onRenameCommit(); if (e.key === "Escape") onRenameCommit() }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              className="w-full bg-white/[0.06] border border-white/[0.15] rounded px-1 py-0 text-xs font-semibold text-white outline-none"
            />
          ) : (
            <p className="text-xs font-semibold text-white leading-tight truncate">{node.label ?? def.name}</p>
          )}
          <p className="text-[9px] text-white/30 leading-tight capitalize">{def.category}</p>
        </div>
        {/* Status indicator */}
        {node.status === "running" && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
        {node.status === "success" && <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />}
        {node.status === "error" && <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />}
        {/* Actions - show on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="h-5 w-5 flex items-center justify-center rounded text-white/20 hover:text-white/60 hover:bg-white/[0.06]">
            <Copy className="h-3 w-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="h-5 w-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Input ports — on left side */}
      {def.inputs.length > 0 && (
        <div className="px-3 pt-1.5 pb-1 space-y-0">
          {def.inputs.map((port) => {
            const isHighlighted = highlightPort?.nodeId === node.id && highlightPort?.portId === port.id
            return (
              <div key={port.id} className="flex items-center gap-1.5 relative" style={{ height: PORT_ROW_H }}>
                <div
                  data-port="input"
                  className={cn(
                    "absolute -left-[17px] h-3 w-3 rounded-full border-2 bg-[#0f0f1a] cursor-crosshair transition-all",
                    isHighlighted ? "border-blue-300 bg-blue-400/30 scale-125" : "border-blue-400 hover:bg-blue-400/20"
                  )}
                  title={`Input: ${port.label} (${port.type})`}
                  onMouseUp={e => onInputPortMouseUp(port.id, e)}
                  onMouseEnter={() => onInputPortMouseEnter(port.id)}
                  onMouseLeave={onInputPortMouseLeave}
                />
                <span className="text-[9px] text-white/25 pl-1 truncate">{port.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Output ports — on right side */}
      {def.outputs.length > 0 && (
        <div className="px-3 pb-1.5 pt-1 space-y-0">
          {def.outputs.map((port) => (
            <div key={port.id} className="flex items-center justify-end gap-1.5 relative" style={{ height: PORT_ROW_H }}>
              <span className="text-[9px] text-white/25 pr-1 truncate">{port.label}</span>
              <div
                data-port="output"
                className="absolute -right-[17px] h-3 w-3 rounded-full border-2 border-emerald-400 bg-[#0f0f1a] cursor-crosshair hover:bg-emerald-400/30 hover:scale-125 transition-all"
                title={`Output: ${port.label} (${port.type})`}
                onMouseDown={e => {
                  e.stopPropagation()
                  // Calculate port center in canvas coords
                  const portEl = e.currentTarget as HTMLElement
                  const canvasEl = portEl.closest(".flex-1.relative") as HTMLElement
                  if (!canvasEl) return
                  const pr = portEl.getBoundingClientRect()
                  const cr = canvasEl.getBoundingClientRect()
                  // We can't read zoom/pan here, so pass client coords and let parent calculate
                  onOutputPortMouseDown(port.id, pr.left + pr.width / 2 - cr.left, pr.top + pr.height / 2 - cr.top, e)
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Output value badge (shown after execution) */}
      {node.status === "success" && node.output && (
        <div className="mx-3 mb-2 px-2 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15 text-[9px] text-emerald-300/70 truncate">
          ✓ {Object.keys(node.output).slice(0, 3).join(", ")}
        </div>
      )}
    </div>
  )
}

// ─── Keyboard Shortcuts Modal ─────────────────────────────────────────────────
const SHORTCUTS = [
  { group: "Canvas", items: [
    { keys: ["Ctrl", "S"], label: "Save workflow" },
    { keys: ["Ctrl", "Z"], label: "Undo" },
    { keys: ["Ctrl", "Y"], label: "Redo" },
    { keys: ["Ctrl", "D"], label: "Duplicate selected node" },
    { keys: ["Ctrl", "A"], label: "Select all nodes" },
    { keys: ["Scroll"], label: "Zoom in/out" },
    { keys: ["Ctrl", "+"], label: "Zoom in" },
    { keys: ["Ctrl", "-"], label: "Zoom out" },
  ]},
  { group: "Nodes", items: [
    { keys: ["Click"], label: "Select node" },
    { keys: ["Double click"], label: "Rename node" },
    { keys: ["Delete"], label: "Delete selected node(s)" },
    { keys: ["Escape"], label: "Deselect / close" },
    { keys: ["/"], label: "Focus node search" },
  ]},
  { group: "Edges", items: [
    { keys: ["Drag", "port →", "port"], label: "Draw connection" },
    { keys: ["Click", "edge"], label: "Delete connection" },
  ]},
  { group: "View", items: [
    { keys: ["M"], label: "Toggle minimap" },
    { keys: ["?"], label: "Toggle keyboard shortcuts" },
    { keys: ["F"], label: "Fit view" },
    { keys: ["Space", "+", "drag"], label: "Pan canvas" },
  ]},
]

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-[#0a0a12] border border-white/[0.1] rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-5">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">{group.group}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <span key={i} className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded",
                          k === "+" || k === "→" || k === "drag" ? "text-white/20" : "bg-white/[0.06] border border-white/[0.1] text-white/60 font-mono"
                        )}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[10px] text-white/20 text-center">Press <kbd className="bg-white/[0.06] border border-white/[0.1] rounded px-1 font-mono">?</kbd> to toggle this panel</p>
      </div>
    </div>
  )
}

// ─── Canvas Minimap ───────────────────────────────────────────────────────────
const MINIMAP_W = 160
const MINIMAP_H = 100
const MINIMAP_PADDING = 20

function CanvasMinimap({ nodes, pan, zoom, canvasRef }: {
  nodes: CanvasNode[]
  pan: { x: number; y: number }
  zoom: number
  canvasRef: React.RefObject<HTMLDivElement | null>
}) {
  if (nodes.length === 0) return null

  const xs = nodes.map(n => n.position.x)
  const ys = nodes.map(n => n.position.y)
  const minX = Math.min(...xs) - MINIMAP_PADDING
  const minY = Math.min(...ys) - MINIMAP_PADDING
  const maxX = Math.max(...xs) + NODE_WIDTH + MINIMAP_PADDING
  const maxY = Math.max(...ys) + 80 + MINIMAP_PADDING
  const contentW = maxX - minX
  const contentH = maxY - minY
  const scaleX = MINIMAP_W / contentW
  const scaleY = MINIMAP_H / contentH
  const scale = Math.min(scaleX, scaleY)

  const canvasW = canvasRef.current?.clientWidth ?? 1200
  const canvasH = canvasRef.current?.clientHeight ?? 800

  // Viewport rect in world coords
  const vpX = (-pan.x / zoom - minX) * scale
  const vpY = (-pan.y / zoom - minY) * scale
  const vpW = (canvasW / zoom) * scale
  const vpH = (canvasH / zoom) * scale

  return (
    <div
      className="absolute bottom-4 right-4 z-10 rounded-xl border border-white/[0.08] bg-[#0a0a14]/90 backdrop-blur-sm overflow-hidden"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
    >
      <svg width={MINIMAP_W} height={MINIMAP_H}>
        {/* Nodes */}
        {nodes.map(n => {
          const nx = (n.position.x - minX) * scale
          const ny = (n.position.y - minY) * scale
          const nw = NODE_WIDTH * scale
          const nh = Math.max(4, 30 * scale)
          const color = n.status === "running" ? "#f59e0b"
            : n.status === "success" ? "#10b981"
            : n.status === "error" ? "#ef4444"
            : "#6d28d9"
          return (
            <rect key={n.id} x={nx} y={ny} width={nw} height={nh}
              rx={2} fill={color} fillOpacity={0.35} stroke={color} strokeOpacity={0.5} strokeWidth={0.5}
            />
          )
        })}
        {/* Viewport rect */}
        <rect x={vpX} y={vpY} width={Math.min(vpW, MINIMAP_W)} height={Math.min(vpH, MINIMAP_H)}
          rx={2} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.25)" strokeWidth={1}
        />
      </svg>
      <div className="absolute bottom-1 right-1.5 text-[8px] text-white/20">map</div>
    </div>
  )
}
