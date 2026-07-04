import type { WorkflowDefinition } from "./types"

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  tags: string[]
  difficulty: "beginner" | "intermediate" | "advanced"
  definition: WorkflowDefinition
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "ai-content-pipeline",
    name: "AI Content Pipeline",
    description: "Fetch a URL, summarize the content with AI, then post the summary to Slack",
    category: "AI",
    icon: "✨",
    color: "#8b5cf6",
    tags: ["ai", "slack", "content", "summarize"],
    difficulty: "beginner",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "http_request",
          label: "Fetch URL",
          position: { x: 80, y: 160 },
          configuration: { method: "GET", url: "https://example.com/article" },
        },
        {
          id: "n2",
          node_type_id: "ai.summarize",
          label: "Summarize",
          position: { x: 340, y: 160 },
          configuration: { model: "gpt-4o-mini", max_words: 150 },
        },
        {
          id: "n3",
          node_type_id: "slack",
          label: "Post to Slack",
          position: { x: 600, y: 160 },
          configuration: { channel: "#general" },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "body", target_node_id: "n2", target_input: "text" },
        { id: "e2", source_node_id: "n2", source_output: "summary", target_node_id: "n3", target_input: "message" },
      ],
    },
  },

  {
    id: "github-pr-notifier",
    name: "GitHub PR Notifier",
    description: "Watch a GitHub repo for new PRs and send email + Slack alerts",
    category: "Developer",
    icon: "🔔",
    color: "#10b981",
    tags: ["github", "slack", "email", "notifications"],
    difficulty: "intermediate",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "schedule",
          label: "Every 15 min",
          position: { x: 80, y: 160 },
          configuration: { cron: "*/15 * * * *" },
        },
        {
          id: "n2",
          node_type_id: "github",
          label: "List PRs",
          position: { x: 320, y: 160 },
          configuration: { operation: "list_prs", owner: "my-org", repo: "my-repo", state: "open" },
        },
        {
          id: "n3",
          node_type_id: "filter_array",
          label: "New PRs Only",
          position: { x: 560, y: 120 },
          configuration: { field: "draft", operator: "equals", value: "false" },
        },
        {
          id: "n4",
          node_type_id: "slack",
          label: "Slack Alert",
          position: { x: 800, y: 80 },
          configuration: { channel: "#engineering" },
        },
        {
          id: "n5",
          node_type_id: "email_send",
          label: "Email Alert",
          position: { x: 800, y: 220 },
          configuration: { to: "team@company.com", subject: "New PR opened" },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "trigger", target_node_id: "n2", target_input: "trigger" },
        { id: "e2", source_node_id: "n2", source_output: "result", target_node_id: "n3", target_input: "array" },
        { id: "e3", source_node_id: "n3", source_output: "result", target_node_id: "n4", target_input: "message" },
        { id: "e4", source_node_id: "n3", source_output: "result", target_node_id: "n5", target_input: "body" },
      ],
    },
  },

  {
    id: "data-etl-pipeline",
    name: "CSV ETL Pipeline",
    description: "Load a CSV file, filter rows, transform data, and write cleaned output",
    category: "Data",
    icon: "🔄",
    color: "#f59e0b",
    tags: ["csv", "etl", "transform", "data"],
    difficulty: "beginner",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "files.parse_csv",
          label: "Parse CSV",
          position: { x: 80, y: 160 },
          configuration: { delimiter: ",", has_header: true },
        },
        {
          id: "n2",
          node_type_id: "filter_array",
          label: "Filter Rows",
          position: { x: 340, y: 160 },
          configuration: { field: "status", operator: "equals", value: "active" },
        },
        {
          id: "n3",
          node_type_id: "sort_array",
          label: "Sort by Date",
          position: { x: 580, y: 160 },
          configuration: { field: "created_at", direction: "desc" },
        },
        {
          id: "n4",
          node_type_id: "files.write",
          label: "Write Output",
          position: { x: 820, y: 160 },
          configuration: { path: "output/cleaned.json", format: "json" },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "rows", target_node_id: "n2", target_input: "array" },
        { id: "e2", source_node_id: "n2", source_output: "result", target_node_id: "n3", target_input: "array" },
        { id: "e3", source_node_id: "n3", source_output: "result", target_node_id: "n4", target_input: "data" },
      ],
    },
  },

  {
    id: "ai-support-triage",
    name: "AI Support Triage",
    description: "Classify incoming support tickets by sentiment and route to the right queue",
    category: "AI",
    icon: "🎯",
    color: "#ec4899",
    tags: ["ai", "support", "classify", "routing"],
    difficulty: "intermediate",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "webhook",
          label: "Ticket Webhook",
          position: { x: 80, y: 200 },
          configuration: {},
        },
        {
          id: "n2",
          node_type_id: "ai.sentiment",
          label: "Sentiment Analysis",
          position: { x: 320, y: 200 },
          configuration: {},
        },
        {
          id: "n3",
          node_type_id: "switch",
          label: "Route by Sentiment",
          position: { x: 560, y: 200 },
          configuration: { field: "sentiment", cases: "positive,negative,neutral" },
        },
        {
          id: "n4",
          node_type_id: "slack",
          label: "Urgent Queue",
          position: { x: 800, y: 80 },
          configuration: { channel: "#urgent-support" },
        },
        {
          id: "n5",
          node_type_id: "slack",
          label: "Standard Queue",
          position: { x: 800, y: 320 },
          configuration: { channel: "#support-queue" },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "body", target_node_id: "n2", target_input: "text" },
        { id: "e2", source_node_id: "n2", source_output: "result", target_node_id: "n3", target_input: "input" },
        { id: "e3", source_node_id: "n3", source_output: "negative", target_node_id: "n4", target_input: "message" },
        { id: "e4", source_node_id: "n3", source_output: "positive", target_node_id: "n5", target_input: "message" },
      ],
    },
  },

  {
    id: "daily-report",
    name: "Daily Report Generator",
    description: "Run on a schedule, collect metrics, generate AI summary, email the team",
    category: "Reporting",
    icon: "📊",
    color: "#06b6d4",
    tags: ["schedule", "ai", "email", "report"],
    difficulty: "intermediate",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "schedule",
          label: "Daily at 9am",
          position: { x: 80, y: 200 },
          configuration: { cron: "0 9 * * *" },
        },
        {
          id: "n2",
          node_type_id: "http_request",
          label: "Fetch Metrics API",
          position: { x: 320, y: 200 },
          configuration: { method: "GET", url: "https://api.example.com/metrics" },
        },
        {
          id: "n3",
          node_type_id: "ai_chat",
          label: "Generate Report",
          position: { x: 560, y: 200 },
          configuration: {
            provider: "openai",
            model: "gpt-4o",
            system_prompt: "You are a business analyst. Generate a concise daily report from the metrics data provided.",
          },
        },
        {
          id: "n4",
          node_type_id: "email_send",
          label: "Email Team",
          position: { x: 800, y: 200 },
          configuration: {
            to: "team@company.com",
            subject: "Daily Report - {{date}}",
          },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "trigger", target_node_id: "n2", target_input: "trigger" },
        { id: "e2", source_node_id: "n2", source_output: "body", target_node_id: "n3", target_input: "message" },
        { id: "e3", source_node_id: "n3", source_output: "reply", target_node_id: "n4", target_input: "body" },
      ],
    },
  },

  {
    id: "multi-step-approval",
    name: "Multi-Step Approval",
    description: "Submit a request via webhook, validate conditions, notify approvers, and log the decision",
    category: "Operations",
    icon: "✅",
    color: "#22c55e",
    tags: ["approval", "webhook", "slack", "conditional"],
    difficulty: "advanced",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "webhook",
          label: "Request Webhook",
          position: { x: 80, y: 240 },
          configuration: {},
        },
        {
          id: "n2",
          node_type_id: "set_vars",
          label: "Extract Fields",
          position: { x: 300, y: 240 },
          configuration: { vars: '{"requester": "{{body.requester}}", "amount": "{{body.amount}}"}' },
        },
        {
          id: "n3",
          node_type_id: "if_condition",
          label: "Amount > $1000?",
          position: { x: 520, y: 240 },
          configuration: { field: "amount", operator: "greater_than", value: "1000" },
        },
        {
          id: "n4",
          node_type_id: "slack",
          label: "Notify Senior Approver",
          position: { x: 760, y: 140 },
          configuration: { channel: "#exec-approvals" },
        },
        {
          id: "n5",
          node_type_id: "slack",
          label: "Notify Manager",
          position: { x: 760, y: 340 },
          configuration: { channel: "#manager-approvals" },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "body", target_node_id: "n2", target_input: "input" },
        { id: "e2", source_node_id: "n2", source_output: "vars", target_node_id: "n3", target_input: "input" },
        { id: "e3", source_node_id: "n3", source_output: "true", target_node_id: "n4", target_input: "message" },
        { id: "e4", source_node_id: "n3", source_output: "false", target_node_id: "n5", target_input: "message" },
      ],
    },
  },

  {
    id: "ai-image-pipeline",
    name: "AI Image Generation Pipeline",
    description: "Take a text prompt, generate an image with AI, and upload it to storage",
    category: "AI",
    icon: "🎨",
    color: "#f97316",
    tags: ["ai", "image", "generation", "storage"],
    difficulty: "beginner",
    definition: {
      nodes: [
        {
          id: "n1",
          node_type_id: "webhook",
          label: "Prompt Input",
          position: { x: 80, y: 200 },
          configuration: {},
        },
        {
          id: "n2",
          node_type_id: "ai_image",
          label: "Generate Image",
          position: { x: 320, y: 200 },
          configuration: { provider: "openai", size: "1024x1024", quality: "standard", model: "dall-e-3" },
        },
        {
          id: "n3",
          node_type_id: "supabase_db",
          label: "Save to DB",
          position: { x: 580, y: 200 },
          configuration: { operation: "insert", table: "generated_images" },
        },
        {
          id: "n4",
          node_type_id: "slack",
          label: "Share Result",
          position: { x: 820, y: 200 },
          configuration: { channel: "#ai-outputs" },
        },
      ],
      edges: [
        { id: "e1", source_node_id: "n1", source_output: "body", target_node_id: "n2", target_input: "prompt" },
        { id: "e2", source_node_id: "n2", source_output: "url", target_node_id: "n3", target_input: "data" },
        { id: "e3", source_node_id: "n2", source_output: "url", target_node_id: "n4", target_input: "message" },
      ],
    },
  },
]

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}

export const TEMPLATE_CATEGORIES = [...new Set(WORKFLOW_TEMPLATES.map(t => t.category))]
