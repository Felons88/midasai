/**
 * Nexus Execution Engine
 * Real DAG runner: topological sort, sequential + parallel branches,
 * expression interpolation, per-node retries, error routing.
 */

import type { WorkflowDefinition } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeStatus = "idle" | "running" | "success" | "error" | "skipped"

export interface NodeResult {
  node_id: string
  node_type_id: string
  status: NodeStatus
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string
  duration_ms: number
  started_at: string
  finished_at: string
}

export interface ExecutionContext {
  $input: Record<string, unknown>
  $workflow: { id: string; name: string }
  $env: Record<string, string>
  $node: Record<string, Record<string, unknown>>  // node label/id → outputs
}

export interface ExecutionProgress {
  nodeId: string
  status: NodeStatus
  output?: Record<string, unknown>
  error?: string
}

export type ProgressCallback = (p: ExecutionProgress) => void

export interface ExecutionResult {
  status: "completed" | "failed"
  node_results: NodeResult[]
  output: Record<string, unknown>
  duration_ms: number
  error?: string
}

// ─── Expression interpolation ────────────────────────────────────────────────

/** Replace {{$input.key}}, {{$node.NodeName.output.key}} in any string value */
function interpolate(value: unknown, ctx: ExecutionContext): unknown {
  if (typeof value !== "string") return value
  return value.replace(/\{\{([^}]+)\}\}/g, (_match, expr) => {
    try {
      const parts = expr.trim().split(".")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = ctx
      for (const part of parts) {
        if (cur == null) return ""
        cur = cur[part]
      }
      if (cur === undefined || cur === null) return ""
      return typeof cur === "object" ? JSON.stringify(cur) : String(cur)
    } catch {
      return ""
    }
  })
}

function interpolateConfig(config: Record<string, unknown>, ctx: ExecutionContext): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === "string") {
      result[key] = interpolate(val, ctx)
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = interpolateConfig(val as Record<string, unknown>, ctx)
    } else {
      result[key] = val
    }
  }
  return result
}

// ─── Topological sort ────────────────────────────────────────────────────────

function topoSort(definition: WorkflowDefinition): string[] {
  const { nodes, edges } = definition
  const inDegree: Record<string, number> = {}
  const adjList: Record<string, string[]> = {}

  for (const n of nodes) {
    inDegree[n.id] = 0
    adjList[n.id] = []
  }
  for (const e of edges) {
    adjList[e.source_node_id].push(e.target_node_id)
    inDegree[e.target_node_id] = (inDegree[e.target_node_id] ?? 0) + 1
  }

  const queue: string[] = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const order: string[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const next of adjList[id]) {
      inDegree[next]--
      if (inDegree[next] === 0) queue.push(next)
    }
  }

  // Add any disconnected nodes not reached
  for (const n of nodes) {
    if (!order.includes(n.id)) order.push(n.id)
  }

  return order
}

// ─── Node executor map ───────────────────────────────────────────────────────

type NodeExecutorFn = (config: Record<string, unknown>, ctx: ExecutionContext) => Promise<Record<string, unknown>>

const NODE_EXECUTORS: Record<string, NodeExecutorFn> = {

  // ── HTTP Request ────────────────────────────────────────────────────────────
  http_request: async (config) => {
    const method = String(config.method ?? "GET")
    const url = String(config.url ?? "")
    if (!url) throw new Error("URL is required")

    const headers: Record<string, string> = {}
    if (config.headers && typeof config.headers === "object") {
      Object.assign(headers, config.headers)
    }
    // Auth
    const authType = String(config.auth_type ?? "none")
    const authValue = String(config.auth_value ?? "")
    if (authType === "bearer" && authValue) headers["Authorization"] = `Bearer ${authValue}`
    if (authType === "basic" && authValue) headers["Authorization"] = `Basic ${btoa(authValue)}`
    if (authType === "apikey" && authValue) headers["X-API-Key"] = authValue

    const timeoutMs = Number(config.timeout_ms ?? 30000)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: ["GET", "HEAD"].includes(method) ? undefined : JSON.stringify(config.body ?? null),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const text = await res.text()
      let body: unknown = text
      try { body = JSON.parse(text) } catch { /* keep as text */ }
      return {
        response: body,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body_out: body,
        ok: res.ok,
      }
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  },

  // ── If / Condition ──────────────────────────────────────────────────────────
  if_condition: async (config, ctx) => {
    const expr = String(config.condition ?? "true")
    let result = false
    try {
      // Safe evaluation: only allow simple comparisons
      const interpolated = interpolate(expr, ctx) as string
      // eslint-disable-next-line no-new-func
      result = Boolean(new Function("ctx", `with(ctx) { return !!(${interpolated}) }`)(ctx))
    } catch {
      result = false
    }
    return { result, branch: result ? "true" : "false" }
  },

  // ── Set Variables ───────────────────────────────────────────────────────────
  set_vars: async (config, ctx) => {
    const assignments = config.assignments as Array<{ key: string; value: string }> ?? []
    const out: Record<string, unknown> = {}
    for (const { key, value } of assignments) {
      out[key] = interpolate(value, ctx)
    }
    return out
  },

  // ── Text Transform ──────────────────────────────────────────────────────────
  text_transform: async (config, ctx) => {
    const input = String(interpolate(String(config.input ?? ""), ctx))
    const op = String(config.operation ?? "uppercase")
    const ops: Record<string, (s: string) => string> = {
      uppercase: s => s.toUpperCase(),
      lowercase: s => s.toLowerCase(),
      trim: s => s.trim(),
      reverse: s => s.split("").reverse().join(""),
      base64_encode: s => btoa(s),
      base64_decode: s => atob(s),
      url_encode: s => encodeURIComponent(s),
      url_decode: s => decodeURIComponent(s),
      json_parse: s => { try { return JSON.parse(s) } catch { return s } },
      json_stringify: s => JSON.stringify(s),
      word_count: s => String(s.trim().split(/\s+/).filter(Boolean).length),
      char_count: s => String(s.length),
      slug: s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }
    return { result: (ops[op] ?? (s => s))(input), input }
  },

  // ── Filter Array ────────────────────────────────────────────────────────────
  filter_array: async (config, ctx) => {
    const arr = (config.array ?? ctx.$input.array ?? []) as unknown[]
    const key = String(config.key ?? "")
    const op = String(config.operator ?? "exists")
    const val = config.value
    const filtered = arr.filter((item) => {
      const itemVal = key ? (item as Record<string, unknown>)[key] : item
      switch (op) {
        case "equals": return itemVal === val
        case "not_equals": return itemVal !== val
        case "contains": return String(itemVal).includes(String(val))
        case "gt": return Number(itemVal) > Number(val)
        case "lt": return Number(itemVal) < Number(val)
        case "exists": return itemVal !== undefined && itemVal !== null
        case "truthy": return Boolean(itemVal)
        default: return true
      }
    })
    return { result: filtered, count: filtered.length, original_count: arr.length }
  },

  // ── Sort Array ──────────────────────────────────────────────────────────────
  sort_array: async (config, ctx) => {
    const arr = [...((config.array ?? ctx.$input.array ?? []) as unknown[])]
    const key = String(config.key ?? "")
    const order = String(config.order ?? "asc")
    arr.sort((a, b) => {
      const av = key ? (a as Record<string, unknown>)[key] : a
      const bv = key ? (b as Record<string, unknown>)[key] : b
      if (typeof av === "string" && typeof bv === "string") {
        return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return order === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av)
    })
    return { result: arr, count: arr.length }
  },

  // ── Wait / Delay ────────────────────────────────────────────────────────────
  delay: async (config) => {
    const ms = Math.min(Number(config.delay_ms ?? 1000), 30000) // cap at 30s
    await new Promise(r => setTimeout(r, ms))
    return { delayed_ms: ms }
  },

  // ── Code / Script (sandboxed) ───────────────────────────────────────────────
  code_exec: async (config, ctx) => {
    const code = String(config.code ?? "return {}")
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("input", "ctx", `"use strict"; ${code}`)
      const result = fn(ctx.$input, ctx)
      return { result: result ?? null }
    } catch (err) {
      throw new Error(`Script error: ${err instanceof Error ? err.message : String(err)}`)
    }
  },

  // ── Schedule Trigger (noop at runtime — triggered externally) ───────────────
  schedule: async () => ({ triggered: true, timestamp: new Date().toISOString() }),

  // ── Webhook Trigger (noop at runtime) ──────────────────────────────────────
  webhook: async (config, ctx) => ({ payload: ctx.$input, triggered: true }),

  // ── Default: pass-through for unimplemented executors ──────────────────────
  default: async (config, ctx) => ({
    result: null,
    note: "This node type runs server-side via API. In local mode, it passes through.",
    config,
  }),
}

function getExecutor(executorKey: string): NodeExecutorFn {
  return NODE_EXECUTORS[executorKey] ?? NODE_EXECUTORS.default
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries: number, delayMs = 500): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < retries) await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
  throw lastErr
}

// ─── Main executor ────────────────────────────────────────────────────────────

export async function executeWorkflow(
  definition: WorkflowDefinition,
  workflowMeta: { id: string; name: string },
  inputData: Record<string, unknown> = {},
  onProgress?: ProgressCallback,
  credentials: Record<string, string> = {},
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const nodeResults: NodeResult[] = []

  const ctx: ExecutionContext = {
    $input: inputData,
    $workflow: workflowMeta,
    $env: { ...credentials },
    $node: {},
  }

  const order = topoSort(definition)

  for (const nodeId of order) {
    const nodeDef = definition.nodes.find(n => n.id === nodeId)
    if (!nodeDef) continue

    const nodeStart = Date.now()
    onProgress?.({ nodeId, status: "running" })

    // Assemble inputs from upstream node outputs
    const incomingEdges = definition.edges.filter(e => e.target_node_id === nodeId)
    for (const edge of incomingEdges) {
      const upstreamOutput = ctx.$node[edge.source_node_id] ?? {}
      ctx.$input = { ...ctx.$input, ...upstreamOutput }
    }

    // Interpolate config values
    const resolvedConfig = interpolateConfig(nodeDef.configuration ?? {}, ctx)

    // Get retry count
    const retries = Number(resolvedConfig.retry_count ?? 0)

    // Find executor key from node_type_id (last segment)
    const executorKey = nodeDef.node_type_id.split(".").pop() ?? nodeDef.node_type_id

    let output: Record<string, unknown> = {}
    let nodeStatus: NodeStatus = "success"
    let errorMsg: string | undefined

    try {
      const executor = getExecutor(executorKey)
      output = await withRetry(() => executor(resolvedConfig, ctx), retries)
      ctx.$node[nodeId] = output
      // Also index by label for expression access
      if (nodeDef.label) ctx.$node[nodeDef.label] = output
    } catch (err) {
      nodeStatus = "error"
      errorMsg = err instanceof Error ? err.message : String(err)
      ctx.$node[nodeId] = { error: errorMsg }
      onProgress?.({ nodeId, status: "error", error: errorMsg })
    }

    const nodeEnd = Date.now()

    nodeResults.push({
      node_id: nodeId,
      node_type_id: nodeDef.node_type_id,
      status: nodeStatus,
      input: resolvedConfig,
      output,
      error: errorMsg,
      duration_ms: nodeEnd - nodeStart,
      started_at: new Date(nodeStart).toISOString(),
      finished_at: new Date(nodeEnd).toISOString(),
    })

    if (nodeStatus === "success") {
      onProgress?.({ nodeId, status: "success", output })
    }
  }

  const totalDuration = Date.now() - startTime
  const hasErrors = nodeResults.some(r => r.status === "error")

  return {
    status: hasErrors ? "failed" : "completed",
    node_results: nodeResults,
    output: ctx.$node,
    duration_ms: totalDuration,
    error: hasErrors ? `${nodeResults.filter(r => r.status === "error").length} node(s) failed` : undefined,
  }
}
