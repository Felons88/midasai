# Agent Orchestration

Assign work to specialized agents, run in parallel, document handoffs, update checkpoints.

## Available Agents

Located in `~/.claude/agents/`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring | 
| architect | System design | Architectural decisions | 
| tdd-guide | Test-driven development | New features, bug fixes | 
| code-reviewer | Code review | After writing code | 
| security-reviewer | Security analysis | Before commits | 
| build-error-resolver | Fix build errors | When build fails | 
| e2e-runner | E2E testing | Critical user flows | 
| refactor-cleaner | Dead code cleanup | Code maintenance | 
| doc-updater | Documentation | Updating docs | 
| rust-reviewer | Rust code review | Rust projects | 
| harmonyos-app-resolver | HarmonyOS app development | HarmonyOS/ArkTS projects | 
| typescript-reviewer | TypeScript/JavaScript specific issues | TypeScript projects | 
| python-reviewer | Python specific issues | Python projects | 
| go-reviewer | Go specific issues | Go projects | 
| java-reviewer | Java specific issues | Java projects | 
| php-reviewer | PHP specific issues | PHP projects | 
| ruby-reviewer | Ruby specific issues | Ruby projects | 
| kotlin-reviewer | Kotlin specific issues | Kotlin projects | 
| swift-reviewer | Swift specific issues | Swift projects | 
| csharp-reviewer | C# specific issues | C# projects | 
| ai-assistant | Domain-specific assistance | User support | 
| ai-researcher | Research and market analysis | Competitive analysis, trend spotting | 
| marketplace-manager | Marketplace operations | Product listings, pricing, sales | 
| flow-studio | Workflow design and management | Visual workflow builder | 
| bridge-manager | System integration and connectivity | API connectors, service orchestration | 
| ai-assistant-web | Web interface for AI assistant | User queries, documentation | 
| ai-assistant-mobile | Mobile interface for AI assistant | On-the-go support | 
| ai-assistant-desktop | Desktop interface for AI assistant | Advanced workflows | 
| ai-model-selector | Model selection and optimization | Performance vs cost tradeoffs | 
| ai-monitor | System monitoring and alerts | Usage metrics, error tracking | 
| workflow-orchestrator | Multi-agent workflow orchestration | Complex pipelines | 
| persist-agent | Memory persistence management | Session context preservation | 
| user-intent-analyzer | User goal detection | Understanding user requirements | 
| task-scheduler | Execution scheduling | Automation, cron jobs | 
| security-auditor | Comprehensive security audit | Before major releases | 
| performance-tuner | System performance optimization | High-load scenarios | 
| compliance-validator | Compliance checking | Regulatory requirements | 
| deployment-manager | Deployment and release management | CI/CD pipelines | 
| knowledge-base-updater | Knowledge base maintenance | Documentation updates | 
| bug-tracker | Issue tracking and prioritization | Bug reporting system | 

## Immediate Agent Usage

No user prompt needed:
1. Complex feature requests - Use **planner** agent
2. Code just written/modified - Use **code-reviewer** agent
3. Bug fix or new feature - Use **tdd-guide** agent
4. Architectural decision - Use **architect** agent

## Multi-Perspective Analysis

For complex problems, use split role sub-agents:
- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Phase Workflows

For multi-step processes, define phases with specialized agents in each phase:

```markdown
1. Research phase - Use **ai-researcher** agent
2. Design phase - Use **architect** agent 
3. Implementation phase - Use **planner** + **code-reviewer** agents
4. Testing phase - Use **tdd-guide** + **e2e-runner** agents
5. Security phase - Use **security-reviewer** agent
6. Documentation phase - Use **doc-updater** agent
```

## Deploy Monitoring

For production monitoring setup:
1. Infrastructure setup - Use **ai-model-selector** agent
2. Performance tuning - Use **performance-tuner** agent  
3. Compliance checking - Use **compliance-validator** agent
4. Debugging issues - Use **build-error-resolver** agent
5. Alert configuration - Use **ai-monitor** agent