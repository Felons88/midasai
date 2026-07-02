001 | MIDAS CORE BIBLE — SYSTEM DEFINITION
002 | MIDAS is an AI-native orchestration and workflow intelligence system
003 | It is designed to manage prompts, agents, memory, workflows, and VM-based inference
004 | MIDAS acts as the "brain layer" over multiple AI tools and infrastructure
005 | It is not a single model, but a distributed reasoning + execution framework
006 | MIDAS includes persistent memory checkpoints that must always be loaded before execution
007 | MIDAS enforces structured reasoning pipelines instead of freeform responses
008 | MIDAS integrates local + cloud models (Ollama, Claude Code, OpenRouter, Gemini)
009 | MIDAS is built to operate as a self-improving system through md-based evolution
010 | MIDAS stores its architecture in markdown files (project bible system)

011 | CORE OBJECTIVES
012 | Build autonomous workflow execution
013 | Maintain persistent memory state across sessions
014 | Improve project files automatically using suggestion engine
015 | Route tasks to best available model based on cost + capability
016 | Enable VM-based scalable inference (Azure / GCP)
017 | Provide developer-first AI orchestration layer
018 | Allow full modular expansion via OpenClaw directory system
019 | Enforce structured prompt architecture (system prompt chaining)
020 | Enable multi-agent collaboration inside workflow engine

021 | PROJECT STRUCTURE — ROOT
022 | /openclaw (core system directory)
023 | /openclaw/core (engine runtime)
024 | /openclaw/workflows (workflow definitions)
025 | /openclaw/memory (checkpoint system)
026 | /openclaw/agents (AI agent definitions)
027 | /openclaw/tools (tool registry)
028 | /openclaw/vm (cloud VM orchestration layer)
029 | /openclaw/prompts (system prompts library)
030 | /openclaw/bible (project documentation system)

031 | CORE ENGINE — OPENCLAW
032 | OpenClaw is the execution runtime for MIDAS
033 | It interprets workflows defined in markdown or JSON
034 | It enforces step-by-step execution instead of direct answers
035 | It validates memory checkpoints before any operation
036 | It prevents unsafe or missing-context execution
037 | It logs all actions for traceability
038 | It supports multi-agent orchestration
039 | It supports branching workflows and rollback
040 | It integrates with Claude Code and OpenRouter APIs

041 | WORKFLOW ENGINE DESIGN
042 | Workflows are DAG-based (directed acyclic graphs)
043 | Each node is a deterministic or AI-assisted step
044 | Nodes can call tools, models, or memory
045 | Workflows require explicit input schema definitions
046 | Outputs must pass validation layer before next node
047 | Workflows are stored in markdown for readability
048 | Workflows can self-modify via suggestion engine
049 | Workflows can fork into parallel execution branches
050 | Workflows always begin with memory preload step

051 | MEMORY SYSTEM — CORE RULE
052 | Memory is ALWAYS loaded before execution
053 | Memory contains user preferences, system state, and project context
054 | Memory is stored in structured markdown checkpoints
055 | Memory is appended after every major workflow completion
056 | Memory cannot be skipped or ignored
057 | Memory includes last 50+ system actions
058 | Memory includes tool usage history
059 | Memory includes architecture decisions
060 | Memory includes known bugs and failures

061 | CHECKPOINT SYSTEM
062 | Checkpoints are immutable snapshots of system state
063 | Checkpoints are timestamped and versioned
064 | Checkpoints are required before destructive operations
065 | Checkpoints enable rollback of workflow states
066 | Checkpoints store reasoning traces (compressed)
067 | Checkpoints are stored in /openclaw/memory/checkpoints
068 | Each checkpoint includes summary + full state
069 | Checkpoints are auto-generated at workflow end
070 | Checkpoints are validated before execution resumes

071 | AGENT SYSTEM
072 | MIDAS supports multiple specialized agents
073 | Architect Agent — designs systems and workflows
074 | Builder Agent — implements code and file structure
075 | Debug Agent — analyzes failures and logs
076 | Memory Agent — manages checkpoints and state
077 | Expansion Agent — improves markdown bible system
078 | Router Agent — selects best model per task
079 | VM Agent — manages cloud execution environments
080 | Safety Agent — validates execution constraints

081 | MODEL ROUTING SYSTEM
082 | Simple tasks → local Ollama models
083 | Medium tasks → OpenRouter GPT-class models
084 | Complex reasoning → Claude Code or GPT-5 class models
085 | Long context tasks → cloud VM inference
086 | Cost optimization is mandatory in routing
087 | Routing decisions are logged
088 | Routing can be overridden manually
089 | Routing system learns from past performance
090 | Routing is stored in memory as policy updates

091 | VM INFRASTRUCTURE
092 | Azure VM cluster used for large model execution
093 | Google Cloud VM used for conversation layer
094 | Ollama runs on lightweight containers
095 | Models are dynamically loaded per request
096 | VM orchestration handled by OpenClaw VM agent
097 | Scaling is event-driven
098 | Idle VMs are paused to reduce cost
099 | GPU nodes reserved for heavy inference
100 | CPU nodes handle workflow orchestration

101 | OPENCLAW INSTALLATION FLOW
102 | Clone repository into /openclaw root directory
103 | Run bootstrap script to initialize system
104 | Install required model connectors
105 | Load base system prompts
106 | Initialize memory checkpoint system
107 | Validate workflow engine integrity
108 | Run test workflow sequence
109 | Enable agent system registry
110 | Activate VM connectors

111 | CLAUDE CODE INTEGRATION
112 | Claude Code used for structured development tasks
113 | Requires system prompt injection layer
114 | Uses --dangerously-skip-permissions flag in dev mode
115 | Claude handles code generation and refactoring
116 | Claude output must pass OpenClaw validation
117 | Claude cannot bypass memory system
118 | Claude is treated as external reasoning engine
119 | Claude responses are parsed into workflow nodes
120 | Claude is logged for audit trail

121 | EXPANSION ENGINE
122 | Reads all markdown files in /openclaw/bible
123 | Suggests improvements at end of each run
124 | Detects missing architecture components
125 | Detects contradictions in system design
126 | Suggests new agents or tools
127 | Suggests workflow optimizations
128 | Writes patch suggestions automatically
129 | Can regenerate entire modules
130 | Prioritizes system clarity and modularity

131 | PROJECT BIBLE SYSTEM
132 | Bible is the single source of truth
133 | All system behavior must be documented in md files
134 | Bible is continuously updated by Expansion Agent
135 | Bible is human-readable and machine-parsable
136 | Bible includes architecture diagrams (text-based)
137 | Bible includes workflow definitions
138 | Bible includes memory schema definitions
139 | Bible includes tool registry
140 | Bible includes VM config definitions

141 | TOOL SYSTEM
142 | Tools are external functions callable by workflows
143 | Tools include web search, code execution, file ops
144 | Tools must be declared before use
145 | Tools must have input/output schema
146 | Tools are sandboxed for safety
147 | Tools cannot modify memory directly
148 | Tools return structured JSON outputs
149 | Tools are version-controlled
150 | Tools can be deprecated and replaced

151 | SECURITY LAYER
152 | Prevents unauthorized workflow execution
153 | Validates all tool calls before execution
154 | Enforces memory integrity rules
155 | Prevents infinite loops in workflows
156 | Requires explicit confirmation for destructive actions
157 | Logs all system changes
158 | Detects anomalous agent behavior
159 | Blocks unsafe model outputs
160 | Enforces sandbox execution for code

161 | PERFORMANCE OPTIMIZATION
162 | Cache frequently used model responses
163 | Preload memory checkpoints
164 | Use lightweight models for routing decisions
165 | Batch VM inference requests
166 | Reduce token usage via compression layers
167 | Use summarization for long memory logs
168 | Lazy-load agents when needed
169 | Parallelize independent workflow nodes
170 | Optimize prompt size per model

171 | FAILURE HANDLING
172 | If workflow fails, rollback to last checkpoint
173 | Log full failure reason in memory
174 | Trigger Debug Agent automatically
175 | Retry with alternative model route
176 | Escalate to human-readable error report
177 | Store failure pattern for learning
178 | Mark unstable workflow nodes
179 | Suggest fix via Expansion Agent
180 | Prevent repeated failure loops

181 | MEMORY FORMAT SPEC
182 | Memory stored in markdown blocks
183 | Structured sections: context, state, logs
184 | Includes timestamp and version
185 | Includes active agent list
186 | Includes last executed workflow
187 | Includes system flags
188 | Includes known issues
189 | Includes optimization notes
190 | Includes next recommended actions

191 | WORKFLOW EXECUTION RULES
192 | Always preload memory
193 | Validate schema before execution
194 | Execute node-by-node
195 | Log every transformation
196 | Do not skip intermediate steps
197 | Allow branching only if defined
198 | Require validation before final output
199 | Commit checkpoint after completion
200 | Suggest improvements after execution

... (CONTINUES BELOW IN SAME FORMAT)