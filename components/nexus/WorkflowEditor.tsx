"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Trash2, Copy, GitBranch, X, Rocket, Sparkles, Package, Upload, Globe,
  Keyboard, Map, MousePointer2, Search, Download, FolderOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getNodeById, NODE_REGISTRY, searchNodes, type NodeDefinition, type NodePort } from "@/lib/nexus/node-registry"
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
  const [showPalette, setShowPalette] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const selectionStart = useRef<{ x: number; y: number } | null>(null)
  const sseRef = useRef<EventSource | null>(null)
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
      if (e.key === "Escape") { setSelectedNodeId(null); setRenamingNodeId(null); setSelectedNodeIds(new Set()); setSelectionBox(null); setShowPalette(false) }
      if (e.key === "?") { e.preventDefault(); setShowShortcuts(prev => !prev) }
      if (e.key === "m" && !e.metaKey && !e.ctrlKey) { setShowMinimap(prev => !prev) }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") { e.preventDefault(); setSelectedNodeIds(new Set(nodes.map(n => n.id))) }
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) { e.preventDefault(); setShowPalette(prev => !prev) }
      if (e.key === "l" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); handleAutoLayout() }
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
    const offsetX = parseFloat(e.dataTransfer.getData("dragOffsetX") || "0")
    const offsetY = parseFloat(e.dataTransfer.getData("dragOffsetY") || "0")
    const x = snapToGrid((e.clientX - rect.left - pan.x - offsetX) / zoom)
    const y = snapToGrid((e.clientY - rect.top - pan.y - offsetY) / zoom)
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

  // ─── Canvas pan + rubber-band selection ─────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isDraggingCanvas.current = true
      lastPanPos.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      return
    }
    // Start rubber-band selection on LMB click directly on canvas bg
    if (e.button === 0 && (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]"))) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        selectionStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        setSelectionBox({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 })
        setSelectedNodeIds(new Set())
        setSelectedNodeId(null)
      }
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
      const nx = snapToGrid((e.clientX - rect.left - pan.x) / zoom - dragOffset.current.x)
      const ny = snapToGrid((e.clientY - rect.top - pan.y) / zoom - dragOffset.current.y)
      const dx = nx - (nodes.find(n => n.id === draggingNodeId.current)?.position.x ?? nx)
      const dy = ny - (nodes.find(n => n.id === draggingNodeId.current)?.position.y ?? ny)
      // If node is part of multi-select, move all selected nodes together
      if (selectedNodeIds.has(draggingNodeId.current!) && selectedNodeIds.size > 1) {
        setNodes(prev => prev.map(n =>
          selectedNodeIds.has(n.id)
            ? { ...n, position: { x: snapToGrid(n.position.x + dx), y: snapToGrid(n.position.y + dy) } }
            : n
        ))
      } else {
        setNodes(prev => prev.map(n => n.id === draggingNodeId.current ? { ...n, position: { x: nx, y: ny } } : n))
      }
      return
    }
    if (drawingEdge.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x2 = (e.clientX - rect.left - pan.x) / zoom
      const y2 = (e.clientY - rect.top - pan.y) / zoom
      setGhostEdge({ x1: drawingEdge.current.x1, y1: drawingEdge.current.y1, x2, y2 })
      return
    }
    // Rubber-band selection
    if (selectionStart.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const sx = selectionStart.current.x
      const sy = selectionStart.current.y
      const bx = Math.min(sx, cx)
      const by = Math.min(sy, cy)
      const bw = Math.abs(cx - sx)
      const bh = Math.abs(cy - sy)
      setSelectionBox({ x: bx, y: by, w: bw, h: bh })
      // Compute world-space selection rect
      const wx1 = (bx - pan.x) / zoom
      const wy1 = (by - pan.y) / zoom
      const wx2 = wx1 + bw / zoom
      const wy2 = wy1 + bh / zoom
      const ids = new Set(nodes.filter(n =>
        n.position.x < wx2 && n.position.x + NODE_WIDTH > wx1 &&
        n.position.y < wy2 && n.position.y + 80 > wy1
      ).map(n => n.id))
      setSelectedNodeIds(ids)
    }
  }, [pan, zoom, nodes, selectedNodeIds])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId.current) pushHistory(nodes, edges)
    isDraggingCanvas.current = false
    draggingNodeId.current = null
    drawingEdge.current = null
    setGhostEdge(null)
    setHighlightPort(null)
    // Finish rubber-band selection
    if (selectionStart.current) {
      selectionStart.current = null
      setSelectionBox(null)
      // selectedNodeIds already set during mousemove
    }
  }, [nodes, edges, pushHistory])

  // ─── Auto-layout (topological rank) ──────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return
    const H_GAP = 220   // horizontal spacing between ranks
    const V_GAP = 120   // vertical spacing within a rank

    // Build adjacency: in-degree + successors
    const inDeg: Record<string, number> = {}
    const succ: Record<string, string[]> = {}
    nodes.forEach(n => { inDeg[n.id] = 0; succ[n.id] = [] })
    edges.forEach(e => {
      inDeg[e.targetNodeId] = (inDeg[e.targetNodeId] ?? 0) + 1
      succ[e.sourceNodeId] = [...(succ[e.sourceNodeId] ?? []), e.targetNodeId]
    })

    // Kahn's BFS topological sort → assign rank (column)
    const rank: Record<string, number> = {}
    const queue = nodes.filter(n => (inDeg[n.id] ?? 0) === 0).map(n => n.id)
    queue.forEach(id => { rank[id] = 0 })
    let head = 0
    while (head < queue.length) {
      const cur = queue[head++]
      for (const next of succ[cur] ?? []) {
        rank[next] = Math.max(rank[next] ?? 0, (rank[cur] ?? 0) + 1)
        inDeg[next]--
        if (inDeg[next] === 0) queue.push(next)
      }
    }
    // Nodes not reached (cycles) get rank = max+1
    const maxRank = Math.max(0, ...Object.values(rank))
    nodes.forEach(n => { if (rank[n.id] === undefined) rank[n.id] = maxRank + 1 })

    // Group by rank, sort within rank by existing y position
    const byRank: Record<number, string[]> = {}
    nodes.forEach(n => {
      const r = rank[n.id] ?? 0
      byRank[r] = [...(byRank[r] ?? []), n.id]
    })
    Object.values(byRank).forEach(ids =>
      ids.sort((a, b) => (nodes.find(n => n.id === a)?.position.y ?? 0) - (nodes.find(n => n.id === b)?.position.y ?? 0))
    )

    // Assign positions
    const posMap: Record<string, { x: number; y: number }> = {}
    Object.entries(byRank).forEach(([rankStr, ids]) => {
      const r = Number(rankStr)
      const totalH = (ids.length - 1) * V_GAP
      ids.forEach((id, i) => {
        posMap[id] = { x: snapToGrid(80 + r * H_GAP), y: snapToGrid(80 + i * V_GAP - totalH / 2 + 300) }
      })
    })

    pushHistory(nodes, edges)
    setNodes(prev => prev.map(n => ({ ...n, position: posMap[n.id] ?? n.position })))
    // Reset zoom/pan to fit
    setTimeout(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, 0)
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

  const handleExecute = useCallback(async () => {
    setExecError(null)
    const errors = getValidationErrors()
    if (errors.length > 0) {
      setExecError(`Fix ${errors.length} error${errors.length > 1 ? "s" : ""} before running:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n…and ${errors.length - 3} more` : ""}`)
      return
    }
    if (nodes.length === 0) { setExecError("Add at least one node before running."); return }

    // Reset all nodes to idle
    setNodes(prev => prev.map(n => ({ ...n, status: "idle" as const, output: undefined })))
    setExecuting(true)

    // Close any existing SSE connection
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null }

    // Try SSE streaming first
    const sseUrl = `/api/nexus/workflows/${workflow.id}/execute/stream`
    let sseWorked = false

    await new Promise<void>((resolve) => {
      const es = new EventSource(sseUrl)
      sseRef.current = es
      let resolved = false
      const done = () => { if (!resolved) { resolved = true; resolve() } }

      es.addEventListener("start", () => { sseWorked = true })

      es.addEventListener("node", (e) => {
        try {
          const p = JSON.parse(e.data) as { nodeId: string; status: string; output?: Record<string, unknown>; error?: string }
          setNodes(prev => prev.map(n =>
            n.id === p.nodeId
              ? { ...n, status: p.status as CanvasNode["status"], output: p.output }
              : n
          ))
        } catch { /* ignore */ }
      })

      es.addEventListener("complete", () => {
        try { onExecute().catch(() => {}) } catch { /* ignore */ }
        es.close(); sseRef.current = null; done()
      })

      es.addEventListener("error", (e) => {
        if (!sseWorked) {
          // SSE not supported / failed — fall back to regular execute
          es.close(); sseRef.current = null; done()
        } else {
          const data = (e as MessageEvent).data
          if (data) {
            try { const p = JSON.parse(data); setExecError(p.message ?? "Execution error") } catch { setExecError("Execution error") }
          }
          es.close(); sseRef.current = null; done()
        }
      })

      // Fallback timeout (30s)
      setTimeout(() => { if (!resolved) { es.close(); sseRef.current = null; done() } }, 30_000)
    })

    // Fallback if SSE didn't work
    if (!sseWorked) {
      try { await onExecute() } catch (err) {
        setExecError(err instanceof Error ? err.message : "Execution failed")
      }
    }

    setExecuting(false)
  }, [nodes, workflow.id, getValidationErrors, onExecute])

  // ─── Export / Import JSON ─────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const definition: WorkflowDefinition = {
      nodes: nodes.map(n => ({ id: n.id, node_type_id: n.definitionId, position: n.position, configuration: n.config, label: n.label })),
      edges: edges.map(e => ({ id: e.id, source_node_id: e.sourceNodeId, source_output: e.sourcePort, target_node_id: e.targetNodeId, target_input: e.targetPort })),
    }
    const blob = new Blob([JSON.stringify({ name: workflow.name, definition }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${workflow.name.replace(/\s+/g, "_")}.nexus.json`
    a.click(); URL.revokeObjectURL(url)
  }, [nodes, edges, workflow.name])

  const importInputRef = useRef<HTMLInputElement>(null)
  const handleImport = useCallback(() => { importInputRef.current?.click() }, [])
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const def = data.definition ?? data
        if (!def.nodes || !def.edges) return
        pushHistory(nodes, edges)
        setNodes(def.nodes.map((n: { id?: string; node_type_id: string; position: { x: number; y: number }; configuration?: Record<string, unknown>; label?: string }) => ({
          id: n.id ?? uid(),
          definitionId: n.node_type_id,
          position: n.position,
          config: (n.configuration ?? {}) as NodeConfigValues,
          label: n.label,
          status: "idle" as const,
        })))
        setEdges(def.edges.map((e: { id?: string; source_node_id: string; source_output: string; target_node_id: string; target_input: string }) => ({
          id: e.id ?? uid(),
          sourceNodeId: e.source_node_id,
          sourcePort: String(e.source_output),
          targetNodeId: e.target_node_id,
          targetPort: String(e.target_input),
        })))
      } catch { /* ignore malformed */ }
    }
    reader.readAsText(file)
    e.target.value = ""
  }, [nodes, edges, pushHistory])

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
          <ToolbarBtn onClick={handleAutoLayout} title="Auto-Layout (L)"><GitBranch className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => setShowMinimap(p => !p)} title={showMinimap ? "Hide Minimap (M)" : "Show Minimap (M)"}>
            <Map className={cn("h-3.5 w-3.5", showMinimap ? "text-violet-400" : "")} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setShowPalette(p => !p)} title="Add Node (/ or ⌘K)">
            <Search className={cn("h-3.5 w-3.5", showPalette ? "text-violet-400" : "")} />
          </ToolbarBtn>
          <ToolbarBtn onClick={handleExport} title="Export as JSON">
            <Download className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={handleImport} title="Import JSON">
            <FolderOpen className="h-3.5 w-3.5" />
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

      {/* ─── Node search palette ──────────────────────────────────────────────── */}
      {showPalette && (
        <NodeSearchPalette
          onClose={() => setShowPalette(false)}
          onSelect={(def) => {
            setShowPalette(false)
            addNodeFromDef(def)
          }}
        />
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
                    {/* Edge midpoint label */}
                    {(() => {
                      const midX = (sp.x + tp.x) / 2
                      const midY = (sp.y + tp.y) / 2
                      const srcOutput = srcNode.output?.[edge.sourcePort]
                      const hasData = srcNode.status === "success" && srcOutput !== undefined
                      const label = hasData
                        ? (typeof srcOutput === "object" ? "{…}" : String(srcOutput).slice(0, 18))
                        : edge.sourcePort !== "output" ? edge.sourcePort : null
                      if (!label) return null
                      return (
                        <g className="pointer-events-none">
                          <rect
                            x={midX - 28} y={midY - 8} width={56} height={16} rx={4}
                            fill={hasData ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.1)"}
                            stroke={hasData ? "rgba(16,185,129,0.25)" : "rgba(139,92,246,0.2)"}
                            strokeWidth={0.5}
                          />
                          <text
                            x={midX} y={midY + 4}
                            textAnchor="middle"
                            fontSize={8}
                            fill={hasData ? "rgba(110,231,183,0.8)" : "rgba(167,139,250,0.6)"}
                            fontFamily="monospace"
                          >
                            {label.length > 12 ? label.slice(0, 12) + "…" : label}
                          </text>
                        </g>
                      )
                    })()}
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

              // Sticky note: special render
              if (def.id === "utility.sticky_note") {
                const noteColor = node.config.color as string ?? "amber"
                const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                  amber:  { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  text: "rgba(251,191,36,0.9)" },
                  blue:   { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  text: "rgba(147,197,253,0.9)" },
                  green:  { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  text: "rgba(110,231,183,0.9)" },
                  red:    { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   text: "rgba(252,165,165,0.9)" },
                  purple: { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)",  text: "rgba(196,181,253,0.9)" },
                }
                const c = colorMap[noteColor] ?? colorMap.amber
                return (
                  <div
                    key={node.id}
                    style={{ position: "absolute", left: node.position.x, top: node.position.y, width: 200, minHeight: 80, userSelect: "none" }}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).tagName === "TEXTAREA") return
                      e.stopPropagation()
                      setSelectedNodeId(node.id)
                      draggingNodeId.current = node.id
                      const cr = canvasRef.current?.getBoundingClientRect()
                      if (cr) dragOffset.current = { x: (e.clientX - cr.left - pan.x) / zoom - node.position.x, y: (e.clientY - cr.top - pan.y) / zoom - node.position.y }
                    }}
                  >
                    <div
                      className="rounded-xl p-3 relative group"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: isSelected ? `0 0 0 2px ${c.border}` : "none" }}
                    >
                      <div className="text-[9px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.text }}>
                        📝 Note
                        <button
                          onClick={e => { e.stopPropagation(); deleteNode(node.id) }}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                          onMouseDown={e => e.stopPropagation()}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <textarea
                        value={String(node.config.text ?? "")}
                        onChange={e => updateNodeConfig(node.id, "text", e.target.value)}
                        placeholder="Add a note…"
                        rows={3}
                        className="w-full bg-transparent text-[10px] resize-none outline-none leading-relaxed placeholder:text-white/20"
                        style={{ color: c.text }}
                        onMouseDown={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )
              }

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
            <CanvasMinimap nodes={nodes} edges={edges} pan={pan} zoom={zoom} canvasRef={canvasRef} onPan={setPan} />
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

      {/* Hidden file input for JSON import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,.nexus.json"
        className="hidden"
        onChange={handleImportFile}
      />
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

      {/* Output value badge (shown after execution) — click to inspect */}
      {node.status === "success" && node.output && (
        <OutputInspector output={node.output} nodeLabel={node.label ?? def.name} />
      )}
      {node.status === "error" && node.output?.error && (
        <div className="mx-3 mb-2 px-2 py-1 rounded-md bg-red-500/8 border border-red-500/15 text-[9px] text-red-300/70 truncate">
          {`✗ ${String(node.output.error).slice(0, 60)}`}
        </div>
      )}
    </div>
  )
}

// ─── Output Inspector Popover ─────────────────────────────────────────────────
function OutputInspector({ output, nodeLabel }: { output: Record<string, unknown>; nodeLabel: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(output, null, 2)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mx-3 mb-2 relative">
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-full px-2 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15 text-[9px] text-emerald-300/70 truncate text-left hover:bg-emerald-500/15 transition-colors flex items-center gap-1"
      >
        <span className="text-emerald-400">✓</span>
        <span className="truncate">{Object.keys(output).slice(0, 4).join(", ")}</span>
        <span className="ml-auto opacity-50">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-1 left-0 right-0 z-50 rounded-xl border border-white/[0.12] bg-[#0b0b18] shadow-2xl overflow-hidden"
          style={{ minWidth: 240, maxWidth: 320 }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-semibold text-white/60 truncate">{nodeLabel} output</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="text-[10px] text-white/30 hover:text-white/70 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.06]"
              >
                {copied ? "✓ copied" : "copy"}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setOpen(false) }}
                className="text-white/20 hover:text-white/60 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-3">
            <pre className="text-[9px] text-emerald-300/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
              {json}
            </pre>
          </div>
          <div className="px-3 py-1.5 border-t border-white/[0.04] flex items-center gap-2 flex-wrap">
            {Object.entries(output).slice(0, 6).map(([k, v]) => (
              <span key={k} className="text-[8px] bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 text-white/40">
                <span className="text-violet-400">{k}</span>: {typeof v === "object" ? "{…}" : String(v).slice(0, 20)}
              </span>
            ))}
          </div>
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
    { keys: ["L"], label: "Auto-layout nodes" },
    { keys: ["/", "or", "⌘K"], label: "Open node palette" },
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
const MM_W = 200
const MM_H = 140
const MM_PAD = 32

function CanvasMinimap({ nodes: nodesProp, edges: edgesProp, pan, zoom, canvasRef, onPan }: {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  pan: { x: number; y: number }
  zoom: number
  canvasRef: React.RefObject<HTMLDivElement | null>
  onPan: (pan: { x: number; y: number }) => void
}) {
  const mmRef = useRef<SVGSVGElement>(null)
  const nodes = nodesProp ?? []
  const edges = edgesProp ?? []

  // World bounds — fallback to a default region when no nodes
  const allX = nodes.length ? nodes.map(n => n.position.x) : [0]
  const allY = nodes.length ? nodes.map(n => n.position.y) : [0]
  const worldMinX = Math.min(...allX) - MM_PAD
  const worldMinY = Math.min(...allY) - MM_PAD
  const worldMaxX = Math.max(...allX) + NODE_WIDTH + MM_PAD
  const worldMaxY = Math.max(...allY) + 100 + MM_PAD
  const worldW = Math.max(worldMaxX - worldMinX, 400)
  const worldH = Math.max(worldMaxY - worldMinY, 300)

  // Scale to fit minimap
  const scaleX = MM_W / worldW
  const scaleY = MM_H / worldH
  const scale = Math.min(scaleX, scaleY, 0.18) // cap so tiny canvases don't over-scale

  // Offset to center content in minimap
  const renderedW = worldW * scale
  const renderedH = worldH * scale
  const offsetX = (MM_W - renderedW) / 2
  const offsetY = (MM_H - renderedH) / 2

  const toMM = (wx: number, wy: number) => ({
    x: offsetX + (wx - worldMinX) * scale,
    y: offsetY + (wy - worldMinY) * scale,
  })

  // Viewport rect in minimap coords
  const canvasW = canvasRef.current?.clientWidth ?? 1200
  const canvasH = canvasRef.current?.clientHeight ?? 800
  const vpWorldX = -pan.x / zoom
  const vpWorldY = -pan.y / zoom
  const vpWorldW = canvasW / zoom
  const vpWorldH = canvasH / zoom
  const vp = toMM(vpWorldX, vpWorldY)
  const vpW = vpWorldW * scale
  const vpH = vpWorldH * scale

  // Click-to-pan: clicking minimap pans canvas to that world position
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = mmRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    // Convert minimap px → world coords
    const wx = (mx - offsetX) / scale + worldMinX
    const wy = (my - offsetY) / scale + worldMinY
    // Center viewport on that world point
    const cw = canvasRef.current?.clientWidth ?? 1200
    const ch = canvasRef.current?.clientHeight ?? 800
    onPan({ x: -(wx * zoom - cw / 2), y: -(wy * zoom - ch / 2) })
  }, [offsetX, offsetY, scale, worldMinX, worldMinY, zoom, canvasRef, onPan])

  return (
    <div
      className="absolute bottom-14 right-3 z-10 select-none"
      style={{ width: MM_W + 2, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))" }}
    >
      {/* Header bar — Supabase-style */}
      <div className="flex items-center justify-between px-2.5 py-1 rounded-t-xl bg-[#111118] border border-b-0 border-white/[0.08]">
        <span className="text-[9px] font-semibold text-white/30 tracking-widest uppercase">Minimap</span>
        <span className="text-[9px] text-white/20">{nodes.length} nodes</span>
      </div>

      {/* Map body */}
      <div className="rounded-b-xl overflow-hidden border border-white/[0.08] bg-[#0d0d1a]">
        <svg
          ref={mmRef}
          width={MM_W}
          height={MM_H}
          className="cursor-crosshair block"
          onClick={handleClick}
        >
          {/* Subtle grid */}
          <defs>
            <pattern id="mm-grid" width={10 * scale} height={10 * scale} patternUnits="userSpaceOnUse"
              patternTransform={`translate(${offsetX % (10 * scale)},${offsetY % (10 * scale)})`}>
              <path d={`M ${10 * scale} 0 L 0 0 0 ${10 * scale}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
            </pattern>
          </defs>
          <rect width={MM_W} height={MM_H} fill="url(#mm-grid)" />

          {/* Edges */}
          {edges.map(edge => {
            const src = nodes.find(n => n.id === edge.sourceNodeId)
            const tgt = nodes.find(n => n.id === edge.targetNodeId)
            if (!src || !tgt) return null
            const s = toMM(src.position.x + NODE_WIDTH, src.position.y + 20)
            const t = toMM(tgt.position.x, tgt.position.y + 20)
            return (
              <line key={edge.id}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke="rgba(139,92,246,0.2)" strokeWidth={0.8}
              />
            )
          })}

          {/* Node blocks */}
          {nodes.map(n => {
            const { x, y } = toMM(n.position.x, n.position.y)
            const nw = Math.max(NODE_WIDTH * scale, 6)
            const nh = Math.max(5, 80 * scale)
            const color = n.status === "running" ? "#f59e0b"
              : n.status === "success" ? "#10b981"
              : n.status === "error" ? "#ef4444"
              : "#7c3aed"
            return (
              <g key={n.id}>
                {/* Shadow */}
                <rect x={x + 0.5} y={y + 0.5} width={nw} height={nh} rx={1.5}
                  fill="rgba(0,0,0,0.4)" />
                {/* Body */}
                <rect x={x} y={y} width={nw} height={nh} rx={1.5}
                  fill={color} fillOpacity={0.18}
                  stroke={color} strokeOpacity={0.6} strokeWidth={0.75}
                />
                {/* Top accent line */}
                <rect x={x} y={y} width={nw} height={Math.max(1.5, nh * 0.12)} rx={1.5}
                  fill={color} fillOpacity={0.7}
                />
              </g>
            )
          })}

          {/* Viewport rect */}
          <rect
            x={vp.x} y={vp.y}
            width={Math.max(vpW, 4)} height={Math.max(vpH, 4)}
            rx={2}
            fill="rgba(139,92,246,0.07)"
            stroke="rgba(139,92,246,0.5)"
            strokeWidth={1}
          />
        </svg>

        {/* Zoom label */}
        <div className="flex items-center justify-between px-2.5 py-0.5 bg-[#111118] border-t border-white/[0.04]">
          <span className="text-[8px] text-white/20 font-mono">{Math.round(zoom * 100)}%</span>
          <span className="text-[8px] text-white/15">click to pan</span>
        </div>
      </div>
    </div>
  )
}

// ─── Node Search Palette ──────────────────────────────────────────────────────
function NodeSearchPalette({ onClose, onSelect }: { onClose: () => void; onSelect: (def: NodeDefinition) => void }) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  const results = query.trim()
    ? searchNodes(query)
    : NODE_REGISTRY.slice(0, 20)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0c0c16] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <Search className="h-4 w-4 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes… (/ or ⌘K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
            onKeyDown={e => {
              if (e.key === "Escape") onClose()
              if (e.key === "Enter" && results.length > 0) { onSelect(results[0]); onClose() }
            }}
          />
          <kbd className="text-[10px] text-white/20 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">No nodes found</div>
          ) : (
            results.map(def => (
              <button
                key={def.id}
                onClick={() => { onSelect(def); onClose() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors text-left group"
              >
                <span className="text-base flex-shrink-0">{def.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white/80 group-hover:text-white truncate">{def.name}</div>
                  <div className="text-[10px] text-white/30 truncate">{def.description}</div>
                </div>
                <span className="text-[9px] text-white/20 bg-white/[0.04] rounded px-1.5 py-0.5 flex-shrink-0">{def.category}</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] text-white/20">{results.length} nodes</span>
          <span className="text-[10px] text-white/20">↵ to add first result</span>
        </div>
      </div>
    </div>
  )
}
