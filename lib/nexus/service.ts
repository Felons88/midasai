import { SupabaseClient } from "@supabase/supabase-js"
import type {
  NexusDirectory,
  NexusWorkflow,
  WorkflowExecution,
  NexusConnection,
  NexusNode,
  ClassificationResult,
  OptimizationResult,
  WorkflowDefinition,
  ExecutionStatus,
} from "./types"

export class NexusService {
  constructor(private supabase: SupabaseClient, private userId: string) {}

  // ─── Directories ─────────────────────────────────────────────────────────────

  async listDirectories() {
    const { data, error } = await this.supabase
      .from("nexus_directories")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as NexusDirectory[]
  }

  async createDirectory(payload: { name: string; path: string; type: string; metadata?: Record<string, unknown> }) {
    const { data, error } = await this.supabase
      .from("nexus_directories")
      .insert({
        user_id: this.userId,
        name: payload.name,
        path: payload.path,
        type: payload.type,
        metadata: payload.metadata ?? {},
      })
      .select()
      .single()
    if (error) throw error
    return data as NexusDirectory
  }

  async deleteDirectory(id: string) {
    const { error } = await this.supabase
      .from("nexus_directories")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId)
    if (error) throw error
  }

  // ─── Nodes ────────────────────────────────────────────────────────────────────

  async listNodes(category?: string) {
    let query = this.supabase.from("nexus_nodes").select("*").eq("is_active", true).order("category").order("name")
    if (category && category !== "all") query = query.eq("category", category)
    const { data, error } = await query
    if (error) throw error
    return data as NexusNode[]
  }

  // ─── Workflows ────────────────────────────────────────────────────────────────

  async listWorkflows() {
    const { data, error } = await this.supabase
      .from("nexus_workflows")
      .select("*")
      .eq("user_id", this.userId)
      .order("updated_at", { ascending: false })
    if (error) throw error
    return data as NexusWorkflow[]
  }

  async getWorkflow(id: string) {
    const { data, error } = await this.supabase
      .from("nexus_workflows")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single()
    if (error) throw error
    return data as NexusWorkflow
  }

  async createWorkflow(payload: { name: string; description?: string; definition?: WorkflowDefinition }) {
    const { data, error } = await this.supabase
      .from("nexus_workflows")
      .insert({
        user_id: this.userId,
        name: payload.name,
        description: payload.description ?? null,
        definition: payload.definition ?? { nodes: [], edges: [] },
        status: "draft",
        execution_count: 0,
      })
      .select()
      .single()
    if (error) throw error
    return data as NexusWorkflow
  }

  async updateWorkflow(id: string, payload: Partial<Pick<NexusWorkflow, "name" | "description" | "definition" | "status" | "last_execution_at">>) {
    const { data, error } = await this.supabase
      .from("nexus_workflows")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single()
    if (error) throw error
    return data as NexusWorkflow
  }

  async deleteWorkflow(id: string) {
    const { error } = await this.supabase
      .from("nexus_workflows")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId)
    if (error) throw error
  }

  // ─── Executions ───────────────────────────────────────────────────────────────

  async listExecutions(workflowId?: string) {
    let query = this.supabase
      .from("nexus_workflow_executions")
      .select("*, workflow:nexus_workflows(id,name)")
      .eq("user_id", this.userId)
      .order("started_at", { ascending: false })
      .limit(50)
    if (workflowId) query = query.eq("workflow_id", workflowId)
    const { data, error } = await query
    if (error) throw error
    return data as WorkflowExecution[]
  }

  async createExecution(workflowId: string, inputData: Record<string, unknown> = {}) {
    const { data, error } = await this.supabase
      .from("nexus_workflow_executions")
      .insert({
        workflow_id: workflowId,
        user_id: this.userId,
        status: "pending",
        input_data: inputData,
        output_data: {},
        node_results: [],
      })
      .select()
      .single()
    if (error) throw error
    return data as WorkflowExecution
  }

  async updateExecutionStatus(
    id: string,
    status: ExecutionStatus,
    output?: Record<string, unknown>,
    error_message?: string
  ) {
    const update: Record<string, unknown> = { status }
    if (output) update.output_data = output
    if (error_message) update.error_message = error_message
    if (status === "completed" || status === "failed" || status === "cancelled") {
      update.completed_at = new Date().toISOString()
    }
    const { data, error: updateErr } = await this.supabase
      .from("nexus_workflow_executions")
      .update(update)
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single()
    if (updateErr) throw updateErr
    return data as WorkflowExecution
  }

  // ─── Connections ──────────────────────────────────────────────────────────────

  async listConnections() {
    const { data, error } = await this.supabase
      .from("nexus_connections")
      .select("*")
      .eq("user_id", this.userId)
      .order("name")
    if (error) throw error
    return data as NexusConnection[]
  }

  async upsertConnection(payload: { name: string; type: string; status: string; connection_config?: Record<string, unknown> }) {
    const { data, error } = await this.supabase
      .from("nexus_connections")
      .upsert({
        user_id: this.userId,
        name: payload.name,
        type: payload.type,
        status: payload.status,
        connection_config: payload.connection_config ?? {},
        last_sync: payload.status === "connected" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,name" })
      .select()
      .single()
    if (error) throw error
    return data as NexusConnection
  }

  async deleteConnection(id: string) {
    const { error } = await this.supabase
      .from("nexus_connections")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId)
    if (error) throw error
  }

  // ─── AI Classification ────────────────────────────────────────────────────────

  async classifyFiles(filePaths: string[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = filePaths.map((path) => {
      const lower = path.toLowerCase()
      let type: ClassificationResult["type"] = "skill"
      let reason = "Default classification"

      if (lower.includes("workflow") || lower.includes("pipeline") || lower.includes("automation")) {
        type = "workflow"
        reason = "Path contains workflow-related keywords"
      } else if (lower.includes("agent") || lower.includes("bot") || lower.includes("assistant")) {
        type = "agent"
        reason = "Path contains agent-related keywords"
      } else if (lower.includes("model") || lower.includes("ml") || lower.includes("ai") || lower.includes("llm")) {
        type = "model"
        reason = "Path contains model-related keywords"
      } else if (lower.endsWith(".md") || lower.endsWith(".ts") || lower.endsWith(".py")) {
        type = "skill"
        reason = "Code or documentation file classified as skill"
      }

      return { file_path: path, type, confidence: 0.8, reason }
    })

    return results
  }

  async optimize(directoryPath: string): Promise<OptimizationResult> {
    const startTime = Date.now()

    // Mock file discovery — in production this calls a server-side glob
    const mockFiles = [
      `${directoryPath}/skills/text-summarizer.md`,
      `${directoryPath}/agents/research-agent.ts`,
      `${directoryPath}/workflows/data-pipeline.json`,
      `${directoryPath}/models/embedding.py`,
    ]

    const classifications = await this.classifyFiles(mockFiles)

    // Upsert classified directories
    const created = await Promise.allSettled(
      classifications.map((c) =>
        this.createDirectory({
          name: c.file_path.split("/").pop() ?? c.file_path,
          path: c.file_path,
          type: c.type,
          metadata: { confidence: c.confidence, reason: c.reason },
        })
      )
    )

    return {
      total_files: mockFiles.length,
      classified: classifications.length,
      directories_created: created.filter((r) => r.status === "fulfilled").length,
      classifications,
      duration_ms: Date.now() - startTime,
    }
  }
}

export function createNexusService(supabase: SupabaseClient, userId: string) {
  return new NexusService(supabase, userId)
}
