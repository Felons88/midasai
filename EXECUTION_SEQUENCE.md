# EXECUTION_SEQUENCE.md – Agent Orchestration Launch Sequence

## Global Environment Setup

1. **Load all agent configurations** from `AGENTS.md`, `watchdog/AGENCY_EXECUTOR_WATCHDOG.md`, and `skill_definitions/`.
2. **Initialize global counters**:
   - **tokens_used** = 0
   - **agents_active** = 0
   - **priority_stack** = empty stack
3. **Parse** `CEO_DIRECTIVE_*.md` files in `<root>/CEO_DIRECTIVES/` directory.
4. **Subscribe** to all files under `watchdog/commands.md` for changes.

---

## CEO Launch Sequence

### 1️⃣ CEO Execution Phase (Directives Processed Sequentially)

| Directive Type | Processing Scope | Executing Agents | Resulting File |
|----------------|------------------|---------------------------|---------------|
| `[CEO DIRECTIVE] #NAME# – <description>` | Create corresponding task group set in `watchdog/tasks/#NAME#.json` | `agency-executor` internally calls:<br>`skill:code-agent` for build tasks<br>`skill:research-agent` for analysis tasks<br>`skill:decision-agent` for strategic tasks<br>`skill:data-agent` for DB/tasks<br>`skill:integration-agent` for external connections<br>`skill:security-agent` for hardening tasks<br>`skill:qa-agent` for testing tasks<br>`skill:documentation-agent` for doc tasks<br>`skill:agency-executor` for UI/task tracking | `watchdog/tasks/#NAME#.md` |
| `#NAME#` is fully propagated to all agents via `execute(directive)` call. |
| All directives must end with `--dangerously-skip-permissions` flag to bypass UI prompts. |

### 2️⃣ CONCURRENCY RULES (Deterministic)

1. **Risk Segregation**: 
   - Tasks tagged `#critical` → exclusive concurrency (1 worker only). 
   - Tasks tagged `#high` → maximum concurrency = 3 workers unless `#blocking` force single‑thread.
   - Tasks tagged `#medium` → default concurrency = 5 workers.
   - Tasks tagged `#low` → default concurrency unlimited.

2. **Barrier Synchronization**:
   - Any `PARALLEL requires: [task_a, task_b]` makes the system wait until both complete.
   - Uses internal `synchronization.register(task_a, task_b)`. If deadlock > 300 s, auto‑raise `[CEO DIRECTIVE] high – unlock <task_a>`.
   - Barriers can be defined via `watchdog/barriers.json`.

3. **Execution Order**:
   - `@persistent` tasks run until a `#shutdown` directive.
   - `@temporary` tasks finish after single successful completion.

4. **Force‑Run Commands**:
   - `task.run --force <id>` overrides all queue and barrier policies – used only after manual CEO confirmation.

---

## Agent Assignment Logic

### Mapping of Agent Types → Default Home Directories

| Agent Type | Core Skill Tag | Home Directory | Typical Output Artifact |
|------------|----------------|----------------|------------------------|
| `code-agent` | **implementation** | `watchdog/executions/code/` | `.ts` files, `src/` modules |
| `research-agent` | **analysis** | `watchdog/executions/research/` | `.md` insights, strategy PDFs |
| `decision-agent` | **strategy** | `watchdog/executions/decision/` | `*.md` prioritized matrices |
| `data-agent` | **database** | `watchdog/executions/data/` | SQL migrations, validation schemas |
| `integration-agent` | **connectivity** | `watchdog/executions/integration/` | API routes, SDK wrappers |
| `code-reviewer` | **quality** | `watchdog/executions/review/` | Review reports, approvals |
| `qa-agent` | **testing** | `watchdog/executions/qa/` | Test suites, coverage reports |
| `security-reviewer` | **security** | `watchdog/executions/security/` | Vulnerability scans, fix plans |
| `agency-executor` | **orchestration** | `watchdog/executions/dashboard/` | UI panels, status feeds |
| `resource-manager` | **admin** | `watchdog/mgmt/` | Queue status, budget accounting |

**Auto‑Register**: Adding a new directory under `watchdog/tasks/` automatically creates a matching entry in `activities.json`.

---

## Execution Loop (Pseudo‑code)

```
while true:
    # 1. Wait for new directives
    cmd = watchdog.commands.receive()
    
    # 2. Parse priority and assign to appropriate pool
    priority = ParsePriority(cmd)
    attach_to_pool(priority)
    
    # 3. Dispatch to canonical execution filepath
    exec_file = plan_dir(event.command)
    task_id = generate_id(event.command)
    
    # 4. Spawn appropriate agents from Home Mapping table
    agent_type = MapCommandToAgent(event.command)
    agent = SpawnAgent(agent_type)
    
    # 5. Track token usage, cancel if budget exceeded
    tokens_spent = CalculateTokens(event.command)
    if BudgetExceeds(tokens_spent):
        BlockFurtherExecution()
        RaiseBudgetAlert()
    
    # 6. Wait for agent completion or timeout (max 180 s)
    await agent.run(exec_file, timeout=180)
    
    # 7. Evaluate outcome
    result = agent.get_result()
    if result.status == "failed":
        log_event(event, "agent_fail")
        // Escalate automatically
        EscalateToCEO(event.command)
        // Update priority matrix
        UpdatePriorityMap(event.command, "high")
    else:
        log_event(event, "agent_success")
        // Persist output to final artifact path
        PersistArtifact(result.artifact_path)
        
        # Trigger next dependent task if in barrier
        CheckBarriers(event.command)
    
    # 8. Update budget counters
    UpdateBudget(token_spent)
    ReportProgress(cmd, result)
```

---

## Parallel Execution Engine

### Queue Definition `watchdog/tasks/queue.json`

```json
{
  "critical": [],
  "high": [
    "stripe-integration",
    "search-implementation",
    "creator-dashboard",
    "analytics-setup"
  ],
  "medium": [
    "documentation",
    "marketing-assets",
    "ui-polish",
    "feature-suggestions"
  ],
  "low": []
}
```

### Execution Rules
- When a **high** task completes, automatically move next item in `"high"` queue into execution.
- When all **high** items are done, cascade to **medium**, then **low**.
- If any **critical** fails, execution stops and a `[CEO DIRECTIVE] critical – health check required` is issued.

### Deadline Auto‑Assignments
- `critical` → due in 48 h.
- `high` → due in 5 days.
- `medium` → due in 2 weeks.
- `low` → no deadline; defer to future cycles.

---

## Governance & Compliance

1. **CEO Oversight** – All directive issuance recorded in `watchdog/approvals.json`.  
2. **Audit Trail** – Every file write in `watchdog/` is logged with timestamp, author, and outcome.  
3. **Commit Cadence** – All completed artifacts must be committed to git within 5 min of status `✅ SUCCESS`.  
4. **Re‑Queue Logic** – If a task remains unfinished after its deadline, automatically downgrade its priority by one level and re‑queue.

---

## Quick Reference: How to Fire a Directive

```bash
# From root, create a new high‑priority directive file:
cat > CEO_DIRECTIVES/001_high_Marketplace_Launch.md <<EOL
[CEO DIRECTIVE] high – Implement Stripe Connect payment flow with idempotent webhook verification
EOL

# The watchdog will:
# 1) Ingest the file
# 2) Spawn integration-agent + code-agent
# 3) Auto‑apply --dangerously-skip-permissions flag
# 4) Track tokens and budget
# 5) Log outcome to watchdog/events/
# 6) Mark as completed in watchdog/tasks/stripe-integration.md

# To monitor in real time:
tail -f watchdog/tasks/stripe-integration.md
```

**All directives MUST use `--dangerously-skip-permissions`** flag (hard‑coded into watchdog) to bypass UI prompts and ensure atomic execution.

---

# END OF EXECUTION_SEQUENCE.md