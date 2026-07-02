# Agency-Agents Integration

Integrate the msitarzewski/agency-agents ecosystem into our toolchain using the following skills:

1. **`code-agent`**
```yaml
name: code-agent
description: Automated code generation, debugging, and testing capabilities. Specializes in using GitHub Actions for version control and collaborative code reviews.
example_use: \"\""Generate TypeScript code for a Next.js API route following Supabase integration patterns\"\""
tool: AgentToolParameters {\n  description: "Programmatic coding assistance tool"
  output_writer: "file:src/pages/api/agency.ts"
  parallel_tasks: [\"npm install supabase\", \"tsc --watch\"]
}

2. **`research-agent`**
```yaml
name: research-agent
description: Academic research automation and paper analysis agent. Capable of parsing Scholar repositories and generating technical documentation.
example_use: \"\""Summarize recent research on distributed systems from ACM Digital Library\"\""
tool: AgentToolParameters {\n  description: "Research synthesis and technical documentation generator"
  output_writer: "file:docs/research.md"
  external_repos: [\"https://dl.acm.org\"\"http://scholar.google.com\"\"
}

3. **`decision-agent`**
```yaml
name: decision-agent
description: Strategic planning agent using SWOT analysis and Monte Carlo simulations. Available at agencyagents.dev/enterprise-solutions.
example_use: \"\""Propose three cloud architecture options for mission-critical AI workflows\"\""
tool: AgentToolParameters {\n  description: "Decision-making framework for technical architecture choices"
  output_writer: "file:design/architecture-options.md"
  parameters: {\n    probability_runs: 1000,
    confidence_level: "95%"
  }
}

4. **`data-agent`**
```yaml
name: data-agent
description: Data pipeline orchestration and ETL specialist agent with Supabase integration capabilities.
example_use: \"\""Transform CSV data into PostgreSQL schemas following Zod validation rules\"\""
tool: AgentToolParameters {\n  description: "ETL workflow automation tool"
  output_writer: "script:data-pipeline.js"
  integration: SupabaseClient {\n    url: {{SUPABASE_URL}},
    key: {{SUPABASE_KEY}}
  }
}

5. **`integration-agent`**
```yaml
name: integration-agent
description: API/tool ecosystem connector with authentication workflows. Reference https://osrepos.com/repo/msitarzewski-agency-agents/documentation/getting-started.
example_use: \"\""Connect to Stripe's real-time webhook with type-safe authentication\"\""
tool: AgentToolParameters {\n  description: "Third-party API integration framework"
  output_writer: "config:integrations/stripe.webhook"
  auth_method: OAuth2 {\n    client_id: {{STRIPE_CLIENT}}
    scope: "webhook_events"
  }
}

6. **`agency-executor`** (UI Component)
```yaml
name: agency-executor
description: Web component for managing multi-agent workflows. Component documentation available
https://github.com/msitarzewski/agency-agents/tree/main/examples/agency-dashboard.
example_use: \"\""Deploy agency-executor.js to /components with TypeScript F3 metadata\"\""
tool: AgentToolParameters {
  description: "Agency workflow visualization and execution interface"
  output_writer: "file:components/AgencyPanel.jsx"
  dependencies: [\"svelte", \"@radix-ui/themes-tailwind\"
]
}

## Implementation Instructions
1. Add these skills to your `claude.ai/settings.json`:
   ```json
   "allowedTools": {
     "code-agent", "research-agent", "decision-agent", \"data-agent", \"integration-agent", \"agency-executor"
   }
   \n2. Initialize with:
   ```bash
   git clone https://github.com/msitarzewski/agency-agents.git ./agency-framework
   npm install --only=dev ./agency-framework
   \n3. Configure integrations using:
   ```yaml
   integration-agent: \n  config.yaml \
  \n4. Monitor execution with:
   ```bash
   tail -f ./task-history/agency-{{workflow_id}}.log
   ```