"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, Trash2, Play, Save, ZoomIn, ZoomOut, Maximize2, Settings, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NexusWorkflow, WorkflowNode, WorkflowEdge, NexusNode } from "@/lib/nexus/types"

const NODE_WIDTH = 200
const NODE_HEIGHT = 80
const PORT_RADIUS = 6

const CATEGORY_COLORS: Record<string, string> = {
  ai: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
  developer: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  database: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  cloud: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  logic: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  files: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  midas: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  analytics: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  default: "from-white/5 to-white/[0.02] border-white/10",
}

const CATEGORY_DOT: Record<string, string> = {
  ai: "bg-violet-400",
  developer: "bg-blue-400",
  database: "bg-emerald-400",
  cloud: "bg-cyan-400",
  logic: "bg-amber-400",
  files: "bg-orange-400",
  midas: "bg-yellow-400",
  analytics: "bg-pink-400",
  default: "bg-white/40",
}

interface WorkflowCanvasProps {
  workflow: NexusWorkflow
  availableNodes: NexusNode[]
  onSave: (definition: NexusWorkflow["definition"]) => Promise<void>
  onExecute: () => Promise<void>
  saving?: boolean
  executing?: boolean
}

interface DragState {
  nodeId: string
  startX: number
  startY: number
  originX: number
  originY: number
}

interface EdgeDrag {
  sourceNodeId: string
  sourceOutput: number
  currentX: number
  currentY: number
}

export function WorkflowCanvas({ workflow, availableNodes, onSave, onExecute, saving, executing }: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow.definition.nodes ?? [])
  const [edges, setEdges] = useState<WorkflowEdge[]>(workflow.definition.edges ?? [])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<DragState | null>(null)
  const [edgeDrag, setEdgeDrag] = useState<EdgeDrag | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showNodePicker, setShowNodePicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedNodeType = selectedNode ? availableNodes.find((a) => a.id === selectedNode.node_type_id) : null

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-node]")) return
      if ((e.target as HTMLElement).closest("[data-port]")) return
      setSelectedNodeId(null)
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    },
    [pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
        return
      }
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / zoom
        const dy = (e.clientY - dragging.startY) / zoom
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging.nodeId ? { ...n, position: { x: dragging.originX + dx, y: dragging.originY + dy } } : n
          )
        )
        return
      }
      if (edgeDrag && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setEdgeDrag((prev) =>
          prev ? { ...prev, currentX: (e.clientX - rect.left - pan.x) / zoom, currentY: (e.clientY - rect.top - pan.y) / zoom } : null
        )
      }
    },
    [isPanning, panStart, dragging, zoom, edgeDrag, pan]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragging(null)
    setEdgeDrag(null)
  }, [])

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      setSelectedNodeId(nodeId)
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      setDragging({ nodeId, startX: e.clientX, startY: e.clientY, originX: node.position.x, originY: node.position.y })
    },
    [nodes]
  )

  const handleOutputPortMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string, outputIndex: number) => {
      e.stopPropagation()
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      setEdgeDrag({
        sourceNodeId: nodeId,
        sourceOutput: outputIndex,
        currentX: (e.clientX - rect.left - pan.x) / zoom,
        currentY: (e.clientY - rect.top - pan.y) / zoom,
      })
    },
    [pan, zoom]
  )

  const handleInputPortMouseUp = useCallback(
    (e: React.MouseEvent, nodeId: string, inputIndex: number) => {
      e.stopPropagation()
      if (!edgeDrag || edgeDrag.sourceNodeId === nodeId) {
        setEdgeDrag(null)
        return
      }
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        source_node_id: edgeDrag.sourceNodeId,
        source_output: edgeDrag.sourceOutput,
        target_node_id: nodeId,
        target_input: inputIndex,
      }
      setEdges((prev) => [...prev.filter((e) => !(e.target_node_id === nodeId && e.target_input === inputIndex)), newEdge])
      setEdgeDrag(null)
    },
    [edgeDrag]
  )

  const addNode = useCallback(
    (nodeType: NexusNode) => {
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        node_type_id: nodeType.id,
        node_type: nodeType,
        position: { x: 200 + nodes.length * 30, y: 150 + nodes.length * 20 },
        configuration: {},
        label: nodeType.name,
      }
      setNodes((prev) => [...prev, newNode])
      setShowNodePicker(false)
      setPickerSearch("")
    },
    [nodes.length]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId))
      setEdges((prev) => prev.filter((e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId))
      if (selectedNodeId === nodeId) setSelectedNodeId(null)
    },
    [selectedNodeId]
  )

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId))
  }, [])

  const getPortPosition = useCallback(
    (nodeId: string, isOutput: boolean, portIndex: number, totalPorts: number) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return { x: 0, y: 0 }
      const spacing = NODE_HEIGHT / (totalPorts + 1)
      return {
        x: node.position.x + (isOutput ? NODE_WIDTH : 0),
        y: node.position.y + spacing * (portIndex + 1),
      }
    },
    [nodes]
  )

  const handleSave = useCallback(async () => {
    await onSave({ nodes, edges, settings: workflow.definition.settings })
  }, [nodes, edges, workflow.definition.settings, onSave])

  const filteredNodes = availableNodes.filter(
    (n) =>
      pickerSearch === "" ||
      n.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      n.category.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId && !(e.target instanceof HTMLInputElement)) {
        deleteNode(selectedNodeId)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedNodeId, deleteNode, handleSave])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowNodePicker(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Node
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-white/40 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          {nodes.length} nodes · {edges.length} edges
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={onExecute} disabled={executing || nodes.length === 0}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {executing ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative bg-[#0a0a0a] cursor-grab active:cursor-grabbing select-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: `${24 * zoom}px ${24 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}>
            {/* SVG edges */}
            <svg ref={svgRef} className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: "100%", height: "100%" }}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.3)" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const srcNode = nodes.find((n) => n.id === edge.source_node_id)
                const tgtNode = nodes.find((n) => n.id === edge.target_node_id)
                if (!srcNode || !tgtNode) return null
                const srcType = availableNodes.find((a) => a.id === srcNode.node_type_id)
                const tgtType = availableNodes.find((a) => a.id === tgtNode.node_type_id)
                const src = getPortPosition(edge.source_node_id, true, edge.source_output, srcType?.outputs ?? 1)
                const tgt = getPortPosition(edge.target_node_id, false, edge.target_input, tgtType?.inputs ?? 1)
                const cx = (src.x + tgt.x) / 2
                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${src.x} ${src.y} C ${cx} ${src.y}, ${cx} ${tgt.y}, ${tgt.x} ${tgt.y}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <path
                      d={`M ${src.x} ${src.y} C ${cx} ${src.y}, ${cx} ${tgt.y}, ${tgt.x} ${tgt.y}`}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="12"
                      className="cursor-pointer pointer-events-auto"
                      onClick={() => deleteEdge(edge.id)}
                    />
                  </g>
                )
              })}
              {/* Live edge drag */}
              {edgeDrag && (() => {
                const srcNode = nodes.find((n) => n.id === edgeDrag.sourceNodeId)
                if (!srcNode) return null
                const srcType = availableNodes.find((a) => a.id === srcNode.node_type_id)
                const src = getPortPosition(edgeDrag.sourceNodeId, true, edgeDrag.sourceOutput, srcType?.outputs ?? 1)
                const cx = (src.x + edgeDrag.currentX) / 2
                return (
                  <path
                    d={`M ${src.x} ${src.y} C ${cx} ${src.y}, ${cx} ${edgeDrag.currentY}, ${edgeDrag.currentX} ${edgeDrag.currentY}`}
                    fill="none"
                    stroke="rgba(139,92,246,0.6)"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                )
              })()}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const nodeType = availableNodes.find((a) => a.id === node.node_type_id)
              const category = nodeType?.category ?? "default"
              const colorClass = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default
              const dotClass = CATEGORY_DOT[category] ?? CATEGORY_DOT.default
              const isSelected = selectedNodeId === node.id
              const inputCount = nodeType?.inputs ?? 0
              const outputCount = nodeType?.outputs ?? 0

              return (
                <div
                  key={node.id}
                  data-node={node.id}
                  style={{ position: "absolute", left: node.position.x, top: node.position.y, width: NODE_WIDTH }}
                  className={cn(
                    "rounded-xl border bg-gradient-to-br cursor-pointer transition-all",
                    colorClass,
                    isSelected && "ring-2 ring-white/30 ring-offset-1 ring-offset-transparent"
                  )}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Input ports */}
                  {Array.from({ length: inputCount }).map((_, i) => {
                    const spacing = NODE_HEIGHT / (inputCount + 1)
                    return (
                      <div
                        key={`in-${i}`}
                        data-port="input"
                        style={{ position: "absolute", left: -PORT_RADIUS, top: spacing * (i + 1) - PORT_RADIUS }}
                        className="w-3 h-3 rounded-full bg-white/20 border border-white/30 hover:bg-white/40 transition-colors cursor-crosshair z-10"
                        onMouseUp={(e) => handleInputPortMouseUp(e, node.id, i)}
                      />
                    )
                  })}

                  <div className="px-3 py-2.5 flex items-center gap-2.5" style={{ height: NODE_HEIGHT }}>
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotClass)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{node.label ?? nodeType?.name}</p>
                      <p className="text-[10px] text-white/40 capitalize">{category}</p>
                    </div>
                    {isSelected && (
                      <button
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => { e.stopPropagation(); deleteNode(node.id) }}
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    )}
                  </div>

                  {/* Output ports */}
                  {Array.from({ length: outputCount }).map((_, i) => {
                    const spacing = NODE_HEIGHT / (outputCount + 1)
                    return (
                      <div
                        key={`out-${i}`}
                        data-port="output"
                        style={{ position: "absolute", right: -PORT_RADIUS, top: spacing * (i + 1) - PORT_RADIUS }}
                        className="w-3 h-3 rounded-full bg-white/20 border border-white/30 hover:bg-violet-400 transition-colors cursor-crosshair z-10"
                        onMouseDown={(e) => handleOutputPortMouseDown(e, node.id, i)}
                      />
                    )
                  })}
                </div>
              )
            })}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl border border-dashed border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-7 w-7 text-white/20" />
                  </div>
                  <p className="text-sm text-white/30">Click Add Node to start building</p>
                  <p className="text-xs text-white/20 mt-1">Drag nodes to position · Connect ports to wire</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inspector Panel */}
        {selectedNode && selectedNodeType && (
          <div className="w-64 border-l border-white/[0.06] bg-white/[0.01] flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{selectedNodeType.name}</p>
                <p className="text-xs text-white/40 capitalize">{selectedNodeType.category}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNodeId(null)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">Label</label>
                <input
                  className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs px-3 outline-none focus:border-white/20"
                  value={selectedNode.label ?? selectedNodeType.name}
                  onChange={(e) =>
                    setNodes((prev) => prev.map((n) => (n.id === selectedNodeId ? { ...n, label: e.target.value } : n)))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium text-white/60 mb-2">Description</p>
                <p className="text-xs text-white/30">{selectedNodeType.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Inputs</span>
                <span className="text-white/60">{selectedNodeType.inputs}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Outputs</span>
                <span className="text-white/60">{selectedNodeType.outputs}</span>
              </div>
              {selectedNodeType.configuration_schema?.fields?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-white/60 mb-2 flex items-center gap-1.5">
                    <Settings className="h-3 w-3" /> Configuration
                  </p>
                  {selectedNodeType.configuration_schema.fields.map((field) => (
                    <div key={field.key} className="mb-3">
                      <label className="text-xs text-white/40 block mb-1">{field.label}</label>
                      <input
                        className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs px-3 outline-none focus:border-white/20"
                        placeholder={field.placeholder ?? ""}
                        value={(selectedNode.configuration[field.key] as string) ?? ""}
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNodeId
                                ? { ...n, configuration: { ...n.configuration, [field.key]: e.target.value } }
                                : n
                            )
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteNode(selectedNode.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Node
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Node Picker Modal */}
      {showNodePicker && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowNodePicker(false)} />
          <div className="fixed left-1/2 top-1/4 -translate-x-1/2 z-50 w-[480px] rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl">
            <div className="p-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white mb-3">Add Node</p>
              <input
                autoFocus
                className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm px-3 outline-none focus:border-white/20 placeholder:text-white/30"
                placeholder="Search nodes..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {filteredNodes.length === 0 && (
                <p className="text-center text-sm text-white/30 py-8">No nodes found</p>
              )}
              {filteredNodes.map((node) => {
                const dotClass = CATEGORY_DOT[node.category] ?? CATEGORY_DOT.default
                return (
                  <button
                    key={node.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left"
                    onClick={() => addNode(node)}
                  >
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotClass)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{node.name}</p>
                      <p className="text-xs text-white/40">{node.description}</p>
                    </div>
                    <span className="text-[10px] text-white/30 capitalize flex-shrink-0">{node.category}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
