export type NexusItemType = "skill" | "model" | "workflow" | "agent"
export type NodeCategory = "ai" | "developer" | "database" | "cloud" | "logic" | "files" | "midas" | "analytics" | "browser" | "ide"
export type WorkflowStatus = "draft" | "active" | "paused" | "archived"
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled"
export type ConnectionType = "IDE" | "Browser" | "Desktop"
export type ConnectionStatus = "connected" | "disconnected" | "pending"

export interface NexusDirectory {
  id: string
  user_id: string
  organization_id?: string | null
  name: string
  path: string
  type: NexusItemType
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NexusNode {
  id: string
  name: string
  description: string
  category: NodeCategory
  icon: string
  inputs: number
  outputs: number
  configuration_schema: NodeConfigSchema
  implementation: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NodeConfigSchema {
  fields: NodeConfigField[]
}

export interface NodeConfigField {
  key: string
  label: string
  type: "string" | "number" | "boolean" | "select" | "textarea" | "json"
  required?: boolean
  default?: unknown
  options?: { label: string; value: string }[]
  placeholder?: string
  description?: string
}

export interface WorkflowNode {
  id: string
  node_type_id: string
  node_type?: NexusNode
  position: { x: number; y: number }
  configuration: Record<string, unknown>
  label?: string
}

export interface WorkflowEdge {
  id: string
  source_node_id: string
  source_output: string
  target_node_id: string
  target_input: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, unknown>
  settings?: {
    timeout_ms?: number
    max_retries?: number
    concurrency?: number
  }
}

export interface NexusWorkflow {
  id: string
  user_id: string
  organization_id?: string | null
  name: string
  description?: string | null
  definition: WorkflowDefinition
  status: WorkflowStatus
  created_at: string
  updated_at: string
  last_execution_at?: string | null
  execution_count: number
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  workflow?: Pick<NexusWorkflow, "id" | "name">
  user_id: string
  status: ExecutionStatus
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  node_results: NodeExecutionResult[]
  error_message?: string | null
  started_at: string
  completed_at?: string | null
  duration_ms?: number | null
}

export interface NodeExecutionResult {
  node_id: string
  node_type_id: string
  status: ExecutionStatus
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string | null
  duration_ms?: number
}

export interface NexusConnection {
  id: string
  user_id: string
  name: string
  type: ConnectionType
  status: ConnectionStatus
  connection_config: Record<string, unknown>
  last_sync?: string | null
  created_at: string
  updated_at: string
}

export interface ClassificationResult {
  file_path: string
  type: NexusItemType
  confidence: number
  reason: string
}

export interface OptimizationResult {
  total_files: number
  classified: number
  directories_created: number
  classifications: ClassificationResult[]
  duration_ms: number
}
