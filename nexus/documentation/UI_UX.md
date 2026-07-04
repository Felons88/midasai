# Nexus UI/UX

## WorkflowEditor (`components/nexus/WorkflowEditor.tsx`)

The main canvas component for building workflows.

### Canvas Features
- **Infinite pan/zoom canvas** — scroll to zoom, drag background to pan, grid snapping (20px)
- **Node drag-and-drop** — drag from sidebar or click to place at canvas center
- **Edge drawing** — drag from output port (green dot) to input port (blue dot); click edge to delete
- **Inline rename** — double-click any node to rename it
- **Undo/redo** — Ctrl+Z / Ctrl+Y, 50-step history stack
- **Fit view** — automatically centers and scales all nodes into viewport
- **Multi-select** — Ctrl+A to select all, Delete removes all selected nodes
- **Selection box** — marquee selection rendered on canvas
- **Minimap** — SVG minimap in bottom-right corner showing node positions and viewport; toggle with M key or toolbar button
- **Keyboard shortcuts modal** — press ? to open full shortcuts reference

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Ctrl+S | Save workflow |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+D | Duplicate selected node |
| Ctrl+A | Select all nodes |
| Delete / Backspace | Delete selected node(s) |
| Escape | Deselect / close modals |
| ? | Toggle shortcuts modal |
| M | Toggle minimap |
| / | Focus node search in sidebar |

### Node Cards
- Status indicator dot (idle / running / success / error) with animated pulse on running
- Output value badge shown after successful execution (first 3 output keys)
- Hover actions: duplicate and delete buttons
- Color-coded border on selection and execution state

### Execution Flow
1. Validate all node required fields → show inline errors
2. Set all nodes to `idle` state
3. Call `onExecute` → API POST `/api/nexus/workflows/[id]/execute`
4. Node status animates: `running` → `success` | `error` per result
5. Exec error toast shown in canvas top-center if workflow fails

### Toolbars
- **Left sidebar** — `NodeSidebar`: searchable, categorized, drag-to-add, favorites, recent
- **Top toolbar** — undo, redo, zoom controls, zoom %, fit view, minimap toggle, shortcuts, save, run, deploy
- **Right panel** — `NodeConfigPanel`: opens when a node is selected; shows per-field validation

### Other Panels
- **WorkflowInspector** — execution timeline with expandable per-node results and stats tab
- **ExecutionHistory** — list of all runs with status, duration, expandable output
- **CredentialManager** — add/delete API keys for integrations
- **ScheduleManager** — configure cron triggers
- **WebhookManager** — manage webhook trigger tokens
- **WorkflowTemplates** — gallery of 7 pre-built templates with one-click use
- **NodeLibrary** — browse all 118+ nodes with search and category filter
- **MidasBridge** — desktop runtime connection manager

### Deploy Animation
Clicking Deploy opens a 5-stage animated modal simulating the deployment pipeline (Validate → Bundle → Upload → Configure → Live).

### Toast Notifications
All CRUD operations (create, save, execute, delete, clone, template use) show bottom-right toast notifications with success/error/info variants and 4-second auto-dismiss.