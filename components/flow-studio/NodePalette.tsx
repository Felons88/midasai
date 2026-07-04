// Node Palette Component for Flow Studio
// Allows users to drag and drop nodes into the workflow canvas

'use client';

import React, { useState } from 'react';

const nodeTypes = [
  {
    id: 'start',
    label: 'Start Node',
    color: 'bg-green-800 border-green-600',
    description: 'Begin workflow execution',
  },
  {
    id: 'process',
    label: 'Process Node',
    color: 'bg-blue-800 border-blue-600',
    description: 'Perform processing or transformation',
  },
  {
    id: 'end',
    label: 'End Node',
    color: 'bg-purple-800 border-purple-600',
    description: 'Complete workflow execution',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    color: 'bg-orange-800 border-orange-600',
    description: 'Invoke AI-powered actions',
  },
  {
    id: 'database',
    label: 'Database',
    color: 'bg-red-800 border-red-600',
    description: 'Connect to database',
  },
  {
    id: 'api-call',
    label: 'API Call',
    color: 'bg-teal-800 border-teal-600',
    description: 'Make external API request',
  },
];

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = nodeTypes.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (event: React.DragEvent, nodeType: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.setData('text/plain', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-full h-full p-4 bg-zinc-900" style={{ borderRight: '1px solid hsl(240 5.9% 20%)' }}>
      <h3 className="text-zinc-100 font-medium mb-3 text-sm">Node Palette</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="space-y-2">
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            className={`p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all hover:scale-105 ${node.color} ${searchQuery ? 'block' : 'hidden'} ${!searchQuery ? 'block' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
          >
            <div className="text-white font-medium text-sm mb-1">{node.label}</div>
            <div className="text-zinc-300 text-xs">{node.description}</div>
          </div>
        ))}
        {filteredNodes.length === 0 && (
          <div className="text-zinc-500 text-sm text-center py-4">
            No nodes found matching "{searchQuery}"
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
        <h4 className="text-zinc-300 text-xs font-medium mb-2">Quick Tips</h4>
        <ul className="text-zinc-400 text-xs space-y-1">
          <li>• Click and drag nodes to the canvas</li>
          <li>• Connect nodes with handles</li>
          <li>• Right-click nodes for options</li>
          <li>• Use mouse wheel to zoom</li>
          <li>• Drag canvas to pan</li>
        </ul>
      </div>
    </div>
  );
}