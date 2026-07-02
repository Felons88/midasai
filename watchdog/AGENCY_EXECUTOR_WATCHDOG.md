# AGENCY_EXECUTOR_WATCHDOG.md – Central Agent Coordination Hub

## Purpose

The **Watcher Agent** monitors all active agency directives, tracks progress across all sub-agents, and automatically spawns new agents or issues escalations when necessary. It runs continuously in the background, ensuring seamless interleaving of work streams.

## Executive Structure

### 1. Executive Command Layer
- **[CEO DIRECTIVE] Format**: Must begin with `[CEO DIRECTIVE]` followed by priority (`high|critical|low|medium`) and task description.
- **Priority Matrix**: 
  - `critical` → Must complete before any `high` tasks.
  - `high` → Core business outcomes (Marketplace launch, Payment processing).
  - `medium` → Enabling features (Analytics, SEO, Documentation).
  - `low` → Cosmetic enhancements (Design polish, UI refinements).

### 2. Execution Hierarchy
- **Level 0**: CEO (this Watcher Agent)
- **Level 1**: Specialized Agency Agents (Code, Research, Decision, Data, Security, Integration, UI, QA, Documentation, Feature‑Suggestion)
- **Level 2**: Sub‑Agents/Workers (e.g., Duplicate‑Barrier agents for sensitive operations, Verification agents for critical paths)

### 3. Resource Management
- **Budget Pool**: Token and compute budget enforced via `budget.json` (default quota: 200 k context‑tokens/day).
- **Hands‑On Queue**: Auto‑managed by `watchdog/command_queue.md`.
- **Concurrency Cap**: ≤ 5 agents can be executing **high** priority tasks simultaneously; excess agents auto‑queue.

---

## Operational Playbooks

### Playbook A – Task Ingestion & Dispatch
1. **Ingest** new lines into `/watchdog/commands.md`.  
2. **Parse** `[CEO DIRECTIVE]` lines and store in `watchdog/queue.json`.  
3. **Spawn** the appropriate Level 1 agent using `ExecuteDirective(directive)`.  
4. **Allocate** workers from `watchdog/worker_pool.json` based on skill map.

### Playbook B – Agent Lifecycle Management
- **Idle Detection**: If an agent writes `# idle #` to its checkpoint file for > 5 min, revive via `TriggerAgent(<name>)`.  
- **Stuck Policy**: Agent reports `# stalled #` → mark task urgent and promote to `high`.  
- **Failure Escalation**: Upon `# failed #` status, add to `watchdog/escalations.md` and notify Level 0.

### Playbook C – Real‑Time Presence
- **Leaderboard**: `watchdog/leaderboard.md` tracks active agents, tasks in‑flight, output tokens consumed.
- **Live Dashboard**: `watchdog/agency-panel.svelte` visualizes execution flow; auto‑refreshes every 30 s.

---

## Execution Log Format

All agent interactions are logged as **structured events** in `/watchdog/events/` with filename convention `event-<timestamp>-<type>.json`.

### Event Schema

```json
{
  "timestamp": "2026-07-01T14:23:11Z",
  "agency": "CEO",
  "level": "high",
  "directive": "Implement Stripe webhook verification",
  "assigned_agents": ["integration-agent", "code-agent"],
  "status": "dispatch_done",
  "output_path": "watchdog/dispatches/stripe-webhook-20260701-142311.json",
  "pools": ["token_budget", "compute_capacity"]
}
```

### Event Types
- `dispatch_done` – Directive handed to agents.
- `agent_start` – Agent spawn.
- `agent_finish` – Agent completed with `✅ SUCCESS`.
- `agent_fail` – Agent exited with `# failed #`, writes to `escalations.md`.
- `budget_usage` – Token / compute consumption.
- `priority_shift` – Priority downgrade/upgrade signaling.

---

## Emergency Protocols

| Situation | Trigger | Action |
|-----------|---------|--------|
| **System Stall** | No progress for > 12 h | Emit `[CEO DIRECTIVE] critical – Force‑run Checkpoint Sync` |
| **Budget Overspend** | Token usage > 90 % of budget | Halt non‑critical agents; enqueue low‑priority tasks only |
| **Dependency Chain Break** | Agent fails to respond after 2 retries | Auto‑generate fallback implementation in `fallback/` |
| **Security Breach** | `#critical#` security finding reported | Auto‑revoke all write permissions; trigger security review via security-agent |

---

## Documentation & Transparency

1. **Public View:** `/watchdog/status.json` mirrors contents of `/watchdog/events/` for external dashboard readability.  
2. **Audit Trail:** All events retained for 30 days; archived into `deploy/audit/` as append‑only logs.  
3. **Replay System:** `replay.sh` reconstructs any workflow segment using stored events.

---

## Governance

- **Policy Updates** must be approved via `[CEO DIRECTIVE]` in `watchdog/policy_updates.md`.  
- **Major Architecture Changes** require a `[CEO DIRECTIVE]`

---  

*This document is a living system artifact; all agents read/write from the `watchdog/` directory to ensure unified state.*  

**Last Updated:** 2026‑07‑01  
**Author:** CEO Agent (autonomous)