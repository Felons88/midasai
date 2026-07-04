# Midas Bridge Protocol Specification

## Overview

The Midas Bridge is a universal bidirectional communication layer between IDEs (VS Code, Cursor, Windsurf, Claude Code, Devin, etc.) and MidasAI. It enables:

1. **IDE → MidasAI**: Send commands, create workflows, execute skills, generate prompts
2. **MidasAI → IDE**: Push workflow results, file operations, notifications, agent outputs
3. **Bidirectional sync**: Workspace context, file changes, terminal commands

## Architecture

```
┌─────────────┐         HTTP/WebSocket         ┌──────────────┐
│   IDE       │◄──────────────────────────────►│ Midas Bridge │
│ (Extension) │  localhost:40001-40004         │  (CLI Server) │
└─────────────┘                                └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │ MidasAI API  │
                                              │ (Nexus, MCP)  │
                                              └──────────────┘
```

## Message Types

### IDE → Bridge Commands

#### 1. Execute Workflow
```json
{
  "type": "execute_workflow",
  "workflow_id": "uuid",
  "input_data": { ... }
}
```

#### 2. Create Workflow
```json
{
  "type": "create_workflow",
  "name": "string",
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

#### 3. Execute Skill
```json
{
  "type": "execute_skill",
  "skill_id": "uuid",
  "context": { ... }
}
```

#### 4. Generate Prompt
```json
{
  "type": "generate_prompt",
  "task": "string",
  "context": { ... }
}
```

#### 5. Sync Workspace
```json
{
  "type": "sync_workspace",
  "files": [
    { "path": "src/index.ts", "content": "..." }
  ]
}
```

#### 6. Execute Terminal Command
```json
{
  "type": "terminal_command",
  "command": "string",
  "cwd": "string"
}
```

### Bridge → IDE Events

#### 1. Workflow Result
```json
{
  "type": "workflow_result",
  "execution_id": "uuid",
  "status": "success|error",
  "output": { ... },
  "node_results": { ... }
}
```

#### 2. File Operation
```json
{
  "type": "file_operation",
  "operation": "create|update|delete",
  "path": "string",
  "content": "string"
}
```

#### 3. Notification
```json
{
  "type": "notification",
  "level": "info|warning|error",
  "message": "string"
}
```

#### 4. Agent Output
```json
{
  "type": "agent_output",
  "agent_id": "uuid",
  "output": "string"
}
```

## Endpoints

### Bridge Server (localhost:PORT)

#### POST `/midas-bridge/command`
- Receives commands from IDE extension
- Returns: `{ success: boolean, result?: any }`

#### GET `/midas-bridge/ping`
- Health check
- Returns: `{ version, ide, status, device }`

#### POST `/midas-bridge/sync`
- Push workspace context to MidasAI
- Returns: `{ success: boolean }`

#### GET `/midas-bridge/events` (SSE)
- Server-Sent Events for real-time updates from MidasAI
- Streams: workflow results, file ops, notifications

## IDE Extension Auto-Installation

The bridge CLI will:

1. Detect running IDE
2. Check if Midas extension is installed
3. If not, install extension automatically:
   - VS Code: `code --install-extension midasai.midas-bridge`
   - Cursor: `cursor --install-extension midasai.midas-bridge`
   - Windsurf: `windsurf --install-extension midasai.midas-bridge`
   - Claude Code: No extension needed (MCP only)
   - Devin: No extension needed (MCP only)

## Auth Flow

1. User runs: `npx @midasai/bridge login`
2. Browser opens to `/cli/auth/[token]`
3. User signs in and approves
4. Auth token saved to `~/.midas-bridge/auth.json`

5. User runs: `npx @midasai/bridge`
6. CLI detects IDE, auto-installs extension if needed
7. Device registered using auth token
8. Bridge server starts on localhost
9. IDE extension connects to bridge
10. MCP connection auto-created for agent access

## Security

- All device tokens are encrypted at rest
- Auth tokens are stored locally only
- Bridge server only listens on localhost
- All API calls use Bearer auth
- RLS policies on all database tables

## Supported IDEs

| IDE | Port | Extension | MCP Support |
|-----|------|-----------|-------------|
| VS Code | 40001 | Yes | Yes |
| Cursor | 40002 | Yes | Yes |
| Windsurf | 40003 | Yes | Yes |
| Claude Code | 40004 | No | Yes |
| Devin | TBD | No | Yes |
| Zed | TBD | TBD | TBD |
| Neovim | TBD | TBD | TBD |

## Future Enhancements

- WebSocket for real-time bidirectional communication
- File watching for auto-sync
- Multi-device support
- Offline mode with queue
- Collaborative editing
