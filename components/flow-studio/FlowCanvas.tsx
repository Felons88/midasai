// Flow Studio Canvas Component
// Handles drag-and-drop canvas with zoom/pan, node connections, and visual validation

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Node, Edge, Connection, addEdge, ReactFlow, Background, Controls, MiniMap, NodeTypes, EdgeTypes, PanelPosition } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface WorkflowNode extends Node {
  data: {
    label: string;
    type: string;
    config?: Record<string, unknown>;
    validation?: { valid: boolean; errors: string[] };
  };
}

interface WorkflowEdge extends Edge {
  data?: {
    label?: string;
  };
}

const nodeTypes: NodeTypes = {};

const edgeTypes: EdgeTypes = {};

export function FlowCanvas({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onConnect,
}: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange?: (changes: any) => void;
  onEdgesChange?: (changes: any) => void;
  onConnect?: (connection: Connection) => void;
}) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const onNodesChangeHandler = useCallback((changes: any) => {
    setNodes((nds) => {
      const updated = typeof changes === 'function' ? changes(nds) : nds;
      if (onNodesChange) onNodesChange(updated);
      return updated;
    });
  }, [onNodesChange]);

  const onEdgesChangeHandler = useCallback((changes: any) => {
    setEdges((eds) => {
      const updated = typeof changes === 'function' ? changes(eds) : eds;
      if (onEdgesChange) onEdgesChange(updated);
      return updated;
    });
  }, [onEdgesChange]);

  const onConnectHandler = useCallback((connection: Connection) => {
    const newEdge = addEdge({ ...connection, type: 'smoothstep', animated: true }, edges);
    setEdges(newEdge);
    if (onConnect) onConnect(connection);
  }, [edges, onConnect]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node);
  }, []);

  const validateWorkflow = useCallback(() => {
    const validationErrors: string[] = [];

    if (nodes.length === 0) {
      validationErrors.push('Workflow must have at least one node');
    }

    const startNodes = nodes.filter(n => n.data.type === 'start');
    if (startNodes.length === 0) {
      validationErrors.push('Workflow must have a start node');
    }

    nodes.forEach(node => {
      const incomingEdges = edges.filter(e => e.target === node.id);
      const outgoingEdges = edges.filter(e => e.source === node.id);

      if (node.data.type !== 'start' && incomingEdges.length === 0) {
        validationErrors.push(`Node "${node.data.label}" has no incoming connections`);
      }

      if (node.data.type !== 'end' && outgoingEdges.length === 0) {
        validationErrors.push(`Node "${node.data.label}" has no outgoing connections`);
      }
    });

    setNodes(current => current.map(node => ({
      ...node,
      data: {
        ...node.data,
        validation: {
          valid: !validationErrors.some(e => e.includes(node.data.label)),
          errors: validationErrors.filter(e => e.includes(node.data.label))
        }
      }
    })));

    return { valid: validationErrors.length === 0, errors: validationErrors };
  }, [nodes, edges]);

  return (
    <div className="w-full h-full bg-zinc-950" style={{ position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnectHandler}
        onViewportChange={setViewport}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={false}
        snapToGrid={true}
        snapGrid={[20, 20]}
        attributionPosition={PanelPosition.BottomLeft}
      >
        <Background color="#3f3f46" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => node.data.validation?.valid === false ? '#ef4444' : '#22c55e'}
          maskColor="rgba(9, 9, 11, 0.8)"
        />
      </ReactFlow>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={validateWorkflow}
          className="px-3 py-1.5 bg-amber-600 text-zinc-950 rounded-lg text-sm font-medium hover:bg-amber-500 transition-colors"
        >
          Validate Workflow
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, zoom: Math.min(v.zoom + 0.1, 2) }))}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-100 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, zoom: Math.max(v.zoom - 0.1, 0.1) }))}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-100 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          -
        </button>
        <button
          onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-100 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          Reset
        </button>
      </div>

      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-xl z-50">
          <h3 className="font-medium text-zinc-100 mb-3">{selectedNode.data.label}</h3>
          <p className="text-zinc-400 text-sm mb-4">Type: {selectedNode.data.type}</p>

          {selectedNode.data.validation && !selectedNode.data.validation.valid && (
            <div className="mb-4 p-2 bg-red-950 border border-red-800 rounded text-red-300 text-sm">
              <strong>Validation Errors:</strong>
              <ul className="mt-1 list-disc list-inside">
                {selectedNode.data.validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {selectedNode.data.config && Object.entries(selectedNode.data.config).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <label className="text-zinc-400 text-sm w-24 capitalize">{key}</label>
                <input
                  type="text"
                  defaultValue={String(value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  onChange={(e) => {
                    setNodes(current => current.map(n =>
                      n.id === selectedNode.id
                        ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: e.target.value } } }
                        : n
                    ));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}