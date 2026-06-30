# Workflow Tool Design Document

**Author:** Architect Agent  
**Created:** 2026-06-29  
**Version:** 0.1  

---

## Table of Contents
1. [Overview](#overview)  
2. [Goals & Scope](#goals--scope)  
3. [High‑Level Architecture](#high-level-architecture)  
4. [Frontend Components](#frontend-components)  
5. [Backend API Functions](#backend-api-functions)  
6. [Design & UI Specification](#design--ui-specification)  
7. [User Flow (End‑to‑End)](#user-flow-end-to-end)  
8. [AI Integration](#ai-integration)  
   - 8.1 [Prompt Design](#prompt-design)  
   - 8.2 [AI Calls & Expected Responses](#ai-calls--expected-responses)  
9. [Memory & Persistence](#memory--persistence)  
10. [Security & Compliance](#security--compliance)  
11. [Testing Strategy](#testing-strategy)  
12. [Deployment & Operations](#deployment--operations)  
13. [Future Extensions & Roadmap](#future-extensions--roadmap)  
14. [Appendices](#appendices)  

---

## Overview
The **Workflow Tool** is a centralized orchestration layer that enables the creation, execution, and monitoring of multi‑agent workflows within the MidasAI platform. It provides:

- A declarative script format for defining workflow phases.  
- Automatic agent spawning, execution, and result aggregation.  
- Built‑in retry, timeout, and budget management.  
- Integration with the existing memory system for persistent state.  

The tool will be consumed by developers and power users to automate complex tasks such as codebase analysis, migration pipelines, and continuous integration checks.

---

## Goals & Scope
| Goal | Success Metric |
|------|----------------|
| **Modular workflow definition** | Users can author workflows via plain‑text scripts without needing to code a custom agent. |
| **Parallel execution support** | Workflows can fan‑out up to 16 concurrent agents, with deterministic aggregation. |
| **Budget awareness** | Workflows respect token limits defined by the `+500k` budget directive. |
| **Reusability** | Workflows can be saved, versioned, and shared across projects. |
| **Observability** | Each workflow run produces a unique `runId` and a summary report accessible via the UI. |

Out of scope: UI design for workflow authoring (will be handled by separate UI team) and low‑level agent internals (maintained by the Agent team).

---

## High‑Level Architecture
```
┌─────────────────────┐
│   Workflow UI / CLI │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Workflow Engine   │
│ (CLI / HTTP RPC)    │
└───────┬─────┬───────┘
        │     │
        ▼     ▼
   ┌─────────────┐   ┌─────────────┐
   │  Agent 1    │   │  Agent N    │
   │ (Explore)   │   │ (Review)    │
   └─────┬───────┘   └─────┬───────┘
         │               │
         ▼               ▼
   ┌─────────────────────────────┐
   │   Result Aggregation &      │
   │   Summary Generation        │
   └─────────────────────────────┘
```

- **Workflow Engine**: Parses the script, orchestrates phases, manages budget, and triggers agents.  
- **Agent Pool**: Dynamically spawned sub‑agents (Explore, Reviewer, Tester, etc.) run in isolated worktrees.  
- **Result Store**: JSONL files per run stored under `~/.claude/workflows/<runId>/` for later inspection.

---

## Frontend Components
| Component | Responsibility | Key Interfaces |
|-----------|----------------|----------------|
| **Workflow Editor** | UI for authoring scripts (YAML/JSON) with syntax highlighting and schema validation. | `onSave(script)`, `validateScript(script)` |
| **Workflow Runner** | Executes the script, monitors agent health, enforces timeouts. | `run(script, args)` |
| **Run Viewer** | Displays live progress (phases, agent logs) and final summary. | `subscribeToProgress(callback)` |
| **Artifact Manager** | Stores generated files (reports, diffs) and attaches them to the run. | `saveArtifact(path, data)` |
| **Budget Monitor** | Tracks token consumption against the session budget. | `budget.spent()`, `budout.remaining()` |

*All components are implemented with React + TypeScript, styled via Shadcn UI, and follow the dark‑luxury marketplace design.*

---

## Backend API Functions
| Function | Signature | Description |
|----------|-----------|-------------|
| `createWorkflow(script: string, args?: any): string` | Returns a `runId`. Persists script and metadata. |
| `runWorkflow(runId: string, args?: any): Promise<RunResult>` | Orchestrates execution, returns aggregated results. |
| `getWorkflowRun(runId: string): RunResult` | Retrieves final report, logs, and artifacts. |
| `listWorkflows(): WorkflowSummary[]` | Lists saved workflows with status and last run time. |
| `cancelWorkflow(runId: string): boolean` | Aborts an in‑progress run. |
| `replayPhase(runId: string, phaseName: string): Promise<PhaseResult>` | Re‑executes a specific phase (useful for debugging). |

All endpoints are typed with TypeScript interfaces and return structured JSON responses.

---

## Design & UI Specification
- **Theme**: Dark background with accent colors (#FF6F61, #00C9A7) for highlights.  
- **Typography**: Inter, 14 px base, line‑height 1.5.  
- **Layout**: Split‑screen editor (left) and live preview (right).  
- **Components**:  
  - **Phase Blocks** – Collapsible cards representing each phase (`Explore`, `Review`, `Test`).  
  - **Agent Dial** – Slider to control concurrency level (1‑16).  
  - **Budget Gauge** – Real‑time token usage meter.  
- **Accessibility**: ARIA labels, focus traps, and keyboard‑only navigation.  

Mockups are stored in `designs/workflow-ui/` as `@dsCard`‑annotated previews.

---

## User Flow (End‑to‑End)

1. **Author** – User writes a workflow script (e.g., `explore → review → test`).  
2. **Validate** – Editor checks syntax and schema; shows warnings.  
3. **Configure** – User sets concurrency, budget, and optional args.  
4. **Execute** – User triggers `Run`.  
5. **Monitor** – Live feed shows phase start/end, agent logs, and budget consumption.  
6. **Complete** – Engine aggregates results, writes a `runId`‑named report, and notifies the user.  
7. **Review** – User opens the report, downloads artifacts, or re‑plays a phase.  

---

## AI Integration

### Prompt Design
- Each phase maps to a **Prompt Template** stored under `prompts/`.  
- Templates use Handlebar‑style placeholders (`{{context}}`, `{{input}}`).  
- Example (Explore phase):
  ```handlebars
  Explore the {{path}} directory and return a JSON object with:
  - fileCount: number
  - topLanguages: array of {language, byteCount}
  - riskScore: number 0‑1
  {{prompt}}
  ```

- Prompts are version‑controlled and reviewed by the **code‑reviewer** agent before deployment.

### AI Calls & Expected Responses
| Phase | Agent Type | Prompt Key | Expected Output |
|-------|------------|------------|-----------------|
| **Explore** | `Explore` | `explorePrompt` | Structured JSON describing discovered files, patterns, and risk assessment. |
| **Design** | `planner` | `designPrompt` | Detailed implementation plan with phases, dependencies, and estimates. |
| **Review** | `code-reviewer` | `reviewPrompt` | List of findings categorized by severity (CRITICAL, HIGH, MEDIUM, LOW) with suggestions. |
| **Test** | `tdd-guide` | `testPrompt` | Boilerplate test files and a coverage target statement. |
| **Summarize** | `summarizer` | `summaryPrompt` | Human‑readable executive summary (≤200 words). |

All AI calls are performed using the **Claude API** with appropriate model selection (Haiku for lightweight phases, Sonnet for design/review).

---

## Memory & Persistence
- **Run Metadata**: Stored in `~/.claude/workflows/<runId>/metadata.json` (name, description, createdAt, budget).  
- **Phase Results**: Each phase writes a JSONL file (`phase-<n>.jsonl`).  
- **Artifacts**: Binary or text results are stored under `artifacts/` and referenced from the summary.  
- **Memory Hooks**: When a workflow updates project state, a `[[workflow-name]]` link is added to `memory/project-state.md`.

---

## Security & Compliance
- **Permission Model**: Workflows run with the same sandbox permissions as the parent session.  
- **Secret Handling**: No secrets are passed to AI prompts; only public configuration is used.  
- **Audit Trail**: Every run creates an immutable log (`run.log`) with timestamps, agent IDs, and exit codes.  
- **Compliance Checks**: Before each run, the **security-reviewer** agent validates that no hard‑coded secrets or unsafe system calls are present.

---

## Testing Strategy
| Test Type | Scope | Tool |
|-----------|-------|------|
| **Unit** | Individual phase logic | Jest (TypeScript) |
| **Integration** | End‑to‑end workflow execution | Playwright test suite against a mock Claude API |
| **Performance** | Budget consumption, concurrency limits | Locust load tests |
| **Security** | Secret leakage, injection risks | `security-reviewer` agent + static analysis |

All tests must achieve **≥80 % coverage** before a workflow can be marked “production‑ready”.

---

## Deployment & Operations
- **Container Image**: Built from `node:20-alpine` with `pnpm` workspace.  
- **CI/CD**: GitHub Actions pipeline runs lint, test, and security scans on each PR.  
- **Monitoring**: Grafana dashboard tracks run volume, success rate, and token budget usage.  
- **Rollback**: Each workflow version is immutable; rollback is achieved by re‑running an older `runId`.

---

## Future Extensions & Roadmap
| Milestone | Target Release | Features |
|-----------|----------------|----------|
| **V0.2** | Q4 2026 | Template marketplace, collaborative editing, webhook triggers. |
| **V1.0** | Q2 2027 | Full UI integration, real‑time collaborative runs, multi‑repo awareness. |
| **V2.0** | Q4 2027 | Autonomous workflow generation via LLM, adaptive budget scaling, cross‑project memory sharing. |

---

## Appendices
### A. Sample Workflow Script (YAML)
```yaml
meta:
  name: "codebase-audit"
  description: "Audit repository for security and quality issues"
phases:
  - title: "Explore"
    prompt: "explorePrompt"
  - title: "Review"
    prompt: "reviewPrompt"
  - title: "Summarize"
    prompt: "summaryPrompt"
args:
  concurrency: 8
  budget: 500000
```

### B. Glossary
- **Agent**: A lightweight LLM‑driven process performing a specific task.  
- **Phase**: A logical step in a workflow script.  
- **RunId**: Unique identifier for a workflow execution.  
- **Budget**: Token quota enforced per session.  

### C. References
- [Agents.md](C:\Users\Hacke\.claude\rules\ecc\common\agents.md) – Agent orchestration rules.  
- [Code Review Standards](C:\Users\Hacke\.claude\rules\ecc\common\code-review.md).  
- [Security Guidelines](C:\Users\Hacke\.claude\rules\ecc\common\security.md).  

---

*End of Document*