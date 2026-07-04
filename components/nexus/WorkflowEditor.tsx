"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Trash2, Copy, GitBranch
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getNodeById, type NodeDefinition } from "@/lib/nexus/node-registry"
import { BrandIcon } from "./BrandIcon"
import { NodeSidebar } from "./NodeSidebar"
import { NodeConfigPanel, type NodeConfigValues, type ValidationState } from "./NodeConfigPanel"
import type { NexusWorkflow, WorkflowDefinition } from "@/lib/nexus/types"

// Canvas node instance
interface CanvasNode {
  id: string
  definitionId: string
  position: { x: number; y: number }
  config: NodeConfigValues
  label?: string
  status?: "idle" | "running" | "success" | "error"
}

// Canvas edge
interface CanvasEdge {
  id: string
  sourceNodeId: string
  sourcePort: string
  targetNodeId: string
  targetPort: string
}

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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle")

  // Drag/pan state
  const isDraggingCanvas = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const draggingNodeId = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  // Edge drawing
  const drawingEdge = useRef<{ sourceNodeId: string; sourcePort: string; x: number; y: number } | null>(null)
  const [ghostEdge, setGhostEdge] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null
  const selectedDef = selectedNode ? getNodeById(selectedNode.definitionId) : null

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave() }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedNodeId) deleteNode(selectedNodeId) }
      if (e.key === "Escape") setSelectedNodeId(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedNodeId])

  // ─── Add node ────────────────────────────────────────────────────────────────
  const addNodeFromDef = useCallback((def: NodeDefinition, pos?: { x: number; y: number }) => {
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
    setNodes(prev => [...prev, newNode])
    setSelectedNodeId(newNode.id)
  }, [pan, zoom])

  const handleSidebarAdd = useCallback((def: NodeDefinition) => addNodeFromDef(def), [addNodeFromDef])

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
    addNodeFromDef(def, { x, y })
  }, [pan, zoom, addNodeFromDef])

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const deleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id))
    setSelectedNodeId(null)
  }, [])

  // ─── Config change ───────────────────────────────────────────────────────────
  const updateNodeConfig = useCallback((nodeId: string, key: string, value: unknown) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n))
  }, [])

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
      setGhostEdge({ x1: drawingEdge.current.x, y1: drawingEdge.current.y, x2, y2 })
    }
  }, [pan, zoom])

  const handleMouseUp = useCallback(() => {
    isDraggingCanvas.current = false
    draggingNodeId.current = null
    drawingEdge.current = null
    setGhostEdge(null)
  }, [])

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
          source_output: Number(e.sourcePort),
          target_node_id: e.targetNodeId,
          target_input: Number(e.targetPort),
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

  const handleExecute = async () => {
    setExecuting(true)
    try { await onExecute() } finally { setExecuting(false) }
  }

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validateNode = useCallback((node: CanvasNode, def: NodeDefinition): { state: ValidationState; message: string } => {
    const missing = def.fields.filter(f => f.required && !node.config[f.key])
    if (missing.length > 0) return { state: "error", message: `Required: ${missing.map(f => f.label).join(", ")}` }
    return { state: "valid", message: "Configuration is valid" }
  }, [])

  // ─── Edge bezier path ─────────────────────────────────────────────────────────
  const edgePath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5
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
          <ToolbarBtn onClick={() => {}} title="Undo (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => {}} title="Redo (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <div className="h-4 w-px bg-white/[0.08] mx-1" />
          <ToolbarBtn onClick={zoomOut} title="Zoom Out"><ZoomOut className="h-3.5 w-3.5" /></ToolbarBtn>
          <span className="text-xs text-white/30 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <ToolbarBtn onClick={zoomIn} title="Zoom In"><ZoomIn className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={fitView} title="Fit View"><Maximize2 className="h-3.5 w-3.5" /></ToolbarBtn>
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
        </div>
      </div>

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
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onClick={e => { if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]")) setSelectedNodeId(null) }}
        >
          {/* Grid background */}
          <CanvasGrid zoom={zoom} pan={pan} />

          {/* Transformed layer */}
          <div
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}
          >
            {/* SVG edges */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }}>
              {edges.map(edge => {
                const srcNode = nodes.find(n => n.id === edge.sourceNodeId)
                const tgtNode = nodes.find(n => n.id === edge.targetNodeId)
                if (!srcNode || !tgtNode) return null
                const srcDef = getNodeById(srcNode.definitionId)
                const tgtDef = getNodeById(tgtNode.definitionId)
                const portIndex = srcDef?.outputs.findIndex(p => p.id === edge.sourcePort) ?? 0
                const tgtIndex = tgtDef?.inputs.findIndex(p => p.id === edge.targetPort) ?? 0
                const x1 = srcNode.position.x + 220
                const y1 = srcNode.position.y + 44 + portIndex * 20
                const x2 = tgtNode.position.x
                const y2 = tgtNode.position.y + 44 + tgtIndex * 20
                return (
                  <path
                    key={edge.id}
                    d={edgePath(x1, y1, x2, y2)}
                    fill="none"
                    stroke="rgba(139,92,246,0.5)"
                    strokeWidth={1.5}
                    strokeDasharray={undefined}
                  />
                )
              })}
              {ghostEdge && (
                <path d={edgePath(ghostEdge.x1, ghostEdge.y1, ghostEdge.x2, ghostEdge.y2)} fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth={1.5} strokeDasharray="4 3" />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const def = getNodeById(node.definitionId)
              if (!def) return null
              const isSelected = node.id === selectedNodeId
              return (
                <CanvasNodeCard
                  key={node.id}
                  node={node}
                  def={def}
                  isSelected={isSelected}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setSelectedNodeId(node.id)
                    draggingNodeId.current = node.id
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
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
                    const copy: CanvasNode = { ...node, id: uid(), position: { x: node.position.x + 40, y: node.position.y + 40 } }
                    setNodes(prev => [...prev, copy])
                    setSelectedNodeId(copy.id)
                  }}
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

          {/* Node count badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-white/20 pointer-events-none">
            <span>{nodes.length} nodes</span>
            <span>·</span>
            <span>{edges.length} connections</span>
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
function ToolbarBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-8 w-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
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
  onMouseDown: (e: React.MouseEvent) => void
  onDelete: () => void
  onDuplicate: () => void
}

function CanvasNodeCard({ node, def, isSelected, onMouseDown, onDelete, onDuplicate }: CanvasNodeCardProps) {
  const statusColor = { idle: "", running: "border-amber-500/60", success: "border-emerald-500/60", error: "border-red-500/60" }[node.status ?? "idle"]

  return (
    <div
      style={{ position: "absolute", left: node.position.x, top: node.position.y, width: 220, userSelect: "none" }}
      onMouseDown={onMouseDown}
      className={cn(
        "rounded-xl border bg-[#0f0f1a] shadow-xl transition-shadow cursor-grab active:cursor-grabbing group",
        isSelected ? "border-violet-500/70 shadow-violet-500/10" : "border-white/[0.08] hover:border-white/[0.14]",
        statusColor,
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
          <p className="text-xs font-semibold text-white leading-tight truncate">{node.label ?? def.name}</p>
          <p className="text-[9px] text-white/30 leading-tight capitalize">{def.category}</p>
        </div>
        {/* Status indicator */}
        {node.status === "running" && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
        {node.status === "success" && <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />}
        {node.status === "error" && <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />}
        {/* Actions - show on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onDuplicate() }}
            className="h-5 w-5 flex items-center justify-center rounded text-white/20 hover:text-white/60 hover:bg-white/[0.06]"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="h-5 w-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Input ports */}
      {def.inputs.length > 0 && (
        <div className="px-3 pt-2 pb-1 space-y-1">
          {def.inputs.map((port, i) => (
            <div key={port.id} className="flex items-center gap-1.5 relative">
              <div
                className="absolute -left-[17px] h-3 w-3 rounded-full border-2 border-blue-400 bg-[#0f0f1a] cursor-crosshair hover:bg-blue-400/20 transition-colors"
                title={`Input: ${port.label}`}
              />
              <span className="text-[9px] text-white/25 pl-1">{port.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output ports */}
      {def.outputs.length > 0 && (
        <div className="px-3 pb-2 pt-1 space-y-1">
          {def.outputs.map((port, i) => (
            <div key={port.id} className="flex items-center justify-end gap-1.5 relative">
              <span className="text-[9px] text-white/25 pr-1">{port.label}</span>
              <div
                className="absolute -right-[17px] h-3 w-3 rounded-full border-2 border-emerald-400 bg-[#0f0f1a] cursor-crosshair hover:bg-emerald-400/20 transition-colors"
                title={`Output: ${port.label}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
