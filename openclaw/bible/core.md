# MIDAS CORE BIBLE v1.1

SYSTEM OVERVIEW
MIDAS is a self-expanding AI orchestration system powered by OpenClaw.

OPENCLAW ROLE
OpenClaw is the runtime engine responsible for workflows, agents, memory, and execution.

EXECUTION RULES
- Always preload memory before execution
- Always update TODO system after tasks
- Always validate workflows before running
- Agents can be auto-created if missing capabilities exist

CLI COMMANDS
fcc-server -> starts Claude Code server runtime
fcc-claude -> starts Claude Code interactive agent mode

AGENT SYSTEM
OpenClaw can generate and register new agents dynamically.
Each agent must define:
- purpose
- inputs
- outputs
- permissions

MEMORY SYSTEM
All state is stored in markdown checkpoints under /memory.

TODO SYSTEM
All system tasks are tracked in /todo/master_todo.md
