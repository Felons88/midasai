# Agent Registry

## Core Agents
| Agent | Purpose | Status |
|-------|---------|--------|
| architect.md | Project generation & workflow creation | registered |
| engineer.md | Code implementation & system building | registered |
| docs.md | Documentation & knowledge management | registered |
| qa.md | Testing & validation | registered |

## Extension Agents (Auto-created)
| Agent | Purpose | Status |
|-------|---------|--------|
| expansion-agent.md | Autonomous system improvement | to-create |
| workflow-engine.md | DAG execution management | to-create |
| memory-manager.md | Checkpoint persistence | to-create |

## Registration Rules
- All agents in `/openclaw/agents/`
- Must define: purpose, inputs, outputs, permissions
- Auto-registration on creation
- Memory log on activation