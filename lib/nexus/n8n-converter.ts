/**
 * n8n to Nexus Workflow Converter
 * 
 * Converts n8n workflow JSON to Nexus workflow format.
 * Handles node type mapping, credential references, and expression transformation.
 */

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from './types'
import { getNodeById } from './node-registry'

export interface N8nNode {
  name: string
  type: string
  position: [number, number]
  parameters?: Record<string, unknown>
  credentials?: Record<string, { id: string; name: string }>
  typeVersion?: number
  id?: string
  notes?: string
  [key: string]: unknown // Allow additional properties for n8n-specific fields
}

export interface N8nWorkflow {
  id?: number
  name: string
  nodes: N8nNode[]
  active?: boolean
  version?: string | number
  settings?: {
    executionOrder?: string
    saveManualExecutions?: boolean
    callerPolicy?: string
    errorWorkflow?: string | null
    timezone?: string
    executionTimeout?: number
    maxExecutions?: number
    retryOnFail?: boolean
    retryCount?: number
    retryDelay?: number
  }
  connections?: Record<string, Record<string, Array<Array<{ node: string; type: string; index: number }>>>>
  description?: string
  tags?: string[]
}

/**
 * Maps n8n node types to Nexus node types
 */
const N8N_TO_NEXUS_MAP: Record<string, string> = {
  // Trigger nodes
  'n8n-nodes-base.stripeTrigger': 'crm.stripe',
  'n8n-nodes-base.webhook': 'dev.webhook',
  'n8n-nodes-base.cron': 'dev.schedule',
  'n8n-nodes-base.manualTrigger': 'dev.manual',
  
  // Communication
  'n8n-nodes-base.slack': 'comm.slack',
  'n8n-nodes-base.discord': 'comm.discord',
  'n8n-nodes-base.emailSend': 'comm.email',
  'n8n-nodes-base.telegram': 'comm.telegram',
  'n8n-nodes-base.twilio': 'comm.twilio',
  
  // CRM
  'n8n-nodes-base.hubspot': 'crm.hubspot',
  'n8n-nodes-base.salesforce': 'crm.salesforce',
  'n8n-nodes-base.pipedrive': 'crm.pipedrive',
  'n8n-nodes-base.zohoCrm': 'crm.zoho',
  'n8n-nodes-base.activeCampaign': 'crm.activecampaign',
  'n8n-nodes-base.acuityScheduling': 'crm.acuity',
  'n8n-nodes-base.affinity': 'crm.affinity',
  
  // Database
  'n8n-nodes-base.postgres': 'db.postgres',
  'n8n-nodes-base.mysql': 'db.mysql',
  'n8n-nodes-base.mongodb': 'db.mongodb',
  'n8n-nodes-base.redis': 'db.redis',
  'n8n-nodes-base.supabase': 'db.supabase',
  'n8n-nodes-base.airtable': 'db.airtable',
  
  // Cloud
  'n8n-nodes-base.awsS3': 'cloud.aws_s3',
  'n8n-nodes-base.awsLambda': 'cloud.aws_lambda',
  'n8n-nodes-base.googleCloudStorage': 'cloud.gcp_storage',
  'n8n-nodes-base.azureBlobStorage': 'cloud.azure_storage',
  
  // Logic
  'n8n-nodes-base.if': 'logic.if',
  'n8n-nodes-base.switch': 'logic.switch',
  'n8n-nodes-base.merge': 'logic.merge',
  'n8n-nodes-base.itemLists': 'data.transform',
  'n8n-nodes-base.function': 'dev.code',
  'n8n-nodes-base.code': 'dev.code',
  
  // Data
  'n8n-nodes-base.httpRequest': 'dev.http',
  'n8n-nodes-base.set': 'data.set',
  'n8n-nodes-base.editFields': 'data.transform',
  'n8n-nodes-base.filter': 'data.filter',
  'n8n-nodes-base.sort': 'data.sort',
  
  // Files
  'n8n-nodes-base.readBinaryFile': 'files.read',
  'n8n-nodes-base.writeBinaryFile': 'files.write',
  'n8n-nodes-base.moveFile': 'files.move',
  'n8n-nodes-base.deleteFile': 'files.delete',
  
  // Developer
  'n8n-nodes-base.github': 'dev.github',
  'n8n-nodes-base.gitlab': 'dev.gitlab',
  'n8n-nodes-base.jira': 'dev.jira',
  'n8n-nodes-base.linear': 'dev.linear',
  'n8n-nodes-base.notion': 'dev.notion',
  
  // Forms
  'n8n-nodes-base.jotform': 'forms.jotform',
  'n8n-nodes-base.typeform': 'forms.typeform',
  
  // AI/ML
  'n8n-nodes-base.openAi': 'ai.openai',
  'n8n-nodes-base.anthropic': 'ai.anthropic',
  'n8n-nodes-base.googlePalm': 'ai.google',
  'n8n-nodes-base.azureOpenAi': 'ai.azure',
  'n8n-nodes-base.mindee': 'ai.mindee',
  
  // Utility
  'n8n-nodes-base.wait': 'util.wait',
  'n8n-nodes-base.noOp': 'util.noop',
  'n8n-nodes-base.stopAndError': 'util.error',
  'n8n-nodes-base.stickyNote': 'util.sticky_note',
}

/**
 * Maps n8n credential types to Nexus credential providers
 */
const N8N_CREDENTIAL_MAP: Record<string, string> = {
  'stripeApi': 'stripe',
  'slackApi': 'slack',
  'discordApi': 'discord',
  'hubspotApi': 'hubspot',
  'hubspotOAuth2Api': 'hubspot',
  'githubApi': 'github',
  'gitlabApi': 'gitlab',
  'notionApi': 'notion',
  'linearApi': 'linear',
  'twilioApi': 'twilio',
  'googleSheetsOAuth2Api': 'google',
  'aws': 'aws',
  'openAiApi': 'openai',
  'anthropicApi': 'anthropic',
  'supabaseApi': 'supabase',
  'airtableTokenApi': 'airtable',
  'airtableApi': 'airtable',
  'gmailOAuth2': 'gmail',
  'telegramApi': 'telegram',
  'activeCampaignApi': 'activecampaign',
  'acuitySchedulingApi': 'acuity',
  'affinityApi': 'affinity',
  'jotFormApi': 'jotform',
  'typeformApi': 'typeform',
  'vonageApi': 'vonage',
  'mindeeReceiptApi': 'mindee',
  'mindeeApi': 'mindee',
  'httpHeaderAuth': 'generic',
  'httpQueryAuth': 'generic',
}

/**
 * Converts n8n expression syntax to Nexus expression syntax
 * n8n: {{ $json["field"] }} or {{ $node["NodeName"].json["field"] }}
 * Nexus: {{ data.field }} or {{ nodes.NodeName.output.field }}
 */
function convertExpression(expr: string): string {
  if (!expr || typeof expr !== 'string') return expr
  
  // Handle $json references
  let converted = expr.replace(/\{\{\s*\$json\[/g, '{{ data.')
  converted = converted.replace(/\]\s*\}\}/g, ' }}')
  
  // Handle $node references
  converted = converted.replace(/\{\{\s*\$node\["([^"]+)"\]\.json\[/g, '{{ nodes.$1.output.')
  converted = converted.replace(/\]\s*\}\}/g, ' }}')
  
  // Handle credential references
  converted = converted.replace(/\{\{\s*\$credentials\.([^}]+)\.id\s*\}\}/g, '{{ credentials.$1 }}')
  
  return converted
}

/**
 * Converts n8n node parameters to Nexus node configuration
 */
function convertParameters(parameters: Record<string, unknown> = {}): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'string') {
      config[key] = convertExpression(value)
    } else if (Array.isArray(value)) {
      config[key] = value.map(item => 
        typeof item === 'string' ? convertExpression(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      config[key] = convertParameters(value as Record<string, unknown>)
    } else {
      config[key] = value
    }
  }
  
  return config
}

/**
 * Converts n8n credentials to Nexus credential references
 */
function convertCredentials(credentials: Record<string, { id: string; name: string }> = {}): Record<string, string> {
  const credRefs: Record<string, string> = {}
  
  for (const [n8nType, cred] of Object.entries(credentials)) {
    const nexusProvider = N8N_CREDENTIAL_MAP[n8nType]
    if (nexusProvider) {
      credRefs[nexusProvider] = cred.name
    }
  }
  
  return credRefs
}

type N8nConnectionTarget = { node: string; type: string; index: number }

/**
 * Converts n8n connections to Nexus edges.
 * n8n stores connections as nested arrays: connections[sourceNode][outputName][branch][connection]
 */
function convertConnections(
  connections: Record<string, Record<string, Array<Array<N8nConnectionTarget>>>>,
  nodeMap: Map<string, string>,
  nexusNodeTypeMap: Map<string, string>
): WorkflowEdge[] {
  const edges: WorkflowEdge[] = []
  let edgeId = 0

  for (const [sourceNodeName, outputConnections] of Object.entries(connections)) {
    const sourceNodeId = nodeMap.get(sourceNodeName)
    if (!sourceNodeId) continue
    const sourceNodeType = nexusNodeTypeMap.get(sourceNodeId)

    for (const [outputName, branches] of Object.entries(outputConnections)) {
      for (const branch of branches) {
        for (const target of branch) {
          const targetNodeId = nodeMap.get(target.node)
          if (!targetNodeId) continue
          const targetNodeType = nexusNodeTypeMap.get(targetNodeId)

          const nexusOutput = mapN8nPortToNexus(outputName, sourceNodeType || '', 'output')
          const nexusInput = mapN8nPortToNexus(target.type, targetNodeType || '', 'input')

          edges.push({
            id: `edge-${edgeId++}`,
            source_node_id: sourceNodeId,
            source_output: nexusOutput,
            target_node_id: targetNodeId,
            target_input: nexusInput
          })
        }
      }
    }
  }

  return edges
}

/**
 * Maps an n8n port name to the best matching Nexus port on a given node definition.
 * n8n uses 'main' for the default data flow; Nexus nodes have specific port ids.
 */
function mapN8nPortToNexus(n8nPort: string, nexusNodeTypeId: string, side: 'input' | 'output'): string {
  const def = getNodeById(nexusNodeTypeId)
  const ports = side === 'input' ? def?.inputs : def?.outputs
  if (!ports || ports.length === 0) return n8nPort

  // n8n 'main' always maps to the first available data port (skip trigger-only ports)
  if (n8nPort === 'main') {
    const dataPort = ports.find(p => p.id !== 'trigger')
    return dataPort ? dataPort.id : ports[0].id
  }

  // Map known n8n port names to Nexus equivalents
  if (n8nPort === 'success' || n8nPort === 'error') {
    const matched = ports.find(p => p.id === n8nPort)
    if (matched) return matched.id
  }

  // Try exact match
  const exact = ports.find(p => p.id === n8nPort)
  if (exact) return exact.id

  // Fallback to first available data port, then first port
  return ports.find(p => p.id !== 'trigger')?.id ?? ports[0].id
}

/**
 * Auto-layout nodes into a compact grid around the origin.
 * Used when imported n8n positions are scattered or missing.
 */
function layoutNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  if (nodes.length === 0) return nodes

  const H_GAP = 240
  const V_GAP = 140

  // Build in-degree + successors from edges
  const inDeg: Record<string, number> = {}
  const succ: Record<string, string[]> = {}
  nodes.forEach(n => { inDeg[n.id] = 0; succ[n.id] = [] })
  edges.forEach(e => {
    inDeg[e.target_node_id] = (inDeg[e.target_node_id] ?? 0) + 1
    succ[e.source_node_id] = [...(succ[e.source_node_id] ?? []), e.target_node_id]
  })

  // Kahn's BFS topological sort → assign rank (column)
  const rank: Record<string, number> = {}
  const queue = nodes.filter(n => (inDeg[n.id] ?? 0) === 0).map(n => n.id)
  queue.forEach(id => { rank[id] = 0 })
  let head = 0
  while (head < queue.length) {
    const cur = queue[head++]
    for (const next of succ[cur] ?? []) {
      rank[next] = Math.max(rank[next] ?? 0, (rank[cur] ?? 0) + 1)
      inDeg[next]--
      if (inDeg[next] === 0) queue.push(next)
    }
  }

  // Nodes not reached (cycles / disconnected) get rank = max+1
  const maxRank = Math.max(0, ...Object.values(rank))
  nodes.forEach(n => { if (rank[n.id] === undefined) rank[n.id] = maxRank + 1 })

  // Group by rank
  const byRank: Record<number, string[]> = {}
  nodes.forEach(n => {
    const r = rank[n.id] ?? 0
    byRank[r] = [...(byRank[r] ?? []), n.id]
  })

  // Assign positions
  const posMap: Record<string, { x: number; y: number }> = {}
  Object.entries(byRank).forEach(([rankStr, ids]) => {
    const r = Number(rankStr)
    const totalH = (ids.length - 1) * V_GAP
    ids.forEach((id, i) => {
      posMap[id] = { x: 80 + r * H_GAP, y: 80 + i * V_GAP - totalH / 2 }
    })
  })

  return nodes.map(n => ({ ...n, position: posMap[n.id] ?? n.position }))
}

/**
 * Finds unique n8n node types in a workflow that are not present in the current
 * Nexus node registry / type mapping.
 */
export function findUnknownN8nNodeTypes(n8nWorkflow: N8nWorkflow): string[] {
  const unknown = new Set<string>()
  for (const node of n8nWorkflow.nodes || []) {
    if (!node.type) continue
    if (!N8N_TO_NEXUS_MAP[node.type] && !getNodeById(node.type.replace('n8n-nodes-base.', ''))) {
      unknown.add(node.type)
    }
  }
  return Array.from(unknown)
}

/**
 * Returns a representative sample node for every unknown n8n node type.
 */
export function getUnknownN8nNodeSamples(n8nWorkflow: N8nWorkflow): Record<string, N8nNode> {
  const samples: Record<string, N8nNode> = {}
  for (const node of n8nWorkflow.nodes || []) {
    if (!node.type) continue
    if (!N8N_TO_NEXUS_MAP[node.type] && !getNodeById(node.type.replace('n8n-nodes-base.', ''))) {
      if (!samples[node.type]) samples[node.type] = node
    }
  }
  return samples
}

/**
 * Main conversion function
 */
export function convertN8nToNexus(n8nWorkflow: N8nWorkflow, options?: { autoLayout?: boolean }): WorkflowDefinition {
  const nodeMap = new Map<string, string>()
  const nexusNodeTypeMap = new Map<string, string>()
  const nodes: WorkflowNode[] = []
  let nodeId = 0
  const credentialRequirements: Set<string> = new Set()

  // Convert nodes
  for (const n8nNode of n8nWorkflow.nodes) {
    const nexusNodeType = N8N_TO_NEXUS_MAP[n8nNode.type] || n8nNode.type.replace('n8n-nodes-base.', '')

    // Track credential requirements
    if (n8nNode.credentials) {
      for (const credType of Object.keys(n8nNode.credentials)) {
        const nexusProvider = N8N_CREDENTIAL_MAP[credType]
        if (nexusProvider) {
          credentialRequirements.add(nexusProvider)
        }
      }
    }

    const id = `node-${nodeId++}`
    const nexusNode: WorkflowNode = {
      id,
      node_type_id: nexusNodeType,
      position: {
        x: n8nNode.position[0],
        y: n8nNode.position[1]
      },
      configuration: {
        ...convertParameters(n8nNode.parameters || {}),
        ...convertCredentials(n8nNode.credentials || {})
      },
      label: n8nNode.name
    }

    nodes.push(nexusNode)
    nodeMap.set(n8nNode.name, id)
    nexusNodeTypeMap.set(id, nexusNodeType)
  }

  // Convert connections
  const edges = convertConnections(n8nWorkflow.connections || {}, nodeMap, nexusNodeTypeMap)

  // Apply auto-layout so imported workflows are grouped and readable
  const positionedNodes = options?.autoLayout !== false ? layoutNodes(nodes, edges) : nodes

  // Convert settings
  const settings = {
    timeout_ms: n8nWorkflow.settings?.executionTimeout || 30000,
    max_retries: n8nWorkflow.settings?.retryCount || 3,
    concurrency: 1
  }

  return {
    nodes: positionedNodes,
    edges,
    settings,
    metadata: {
      source: 'n8n',
      original_name: n8nWorkflow.name,
      credential_requirements: Array.from(credentialRequirements),
      description: n8nWorkflow.description,
      tags: n8nWorkflow.tags
    }
  }
}

/**
 * Validates if an n8n workflow can be converted
 */
export function validateN8nWorkflow(n8nWorkflow: N8nWorkflow): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!n8nWorkflow.nodes || !Array.isArray(n8nWorkflow.nodes)) {
    errors.push('Invalid workflow: missing or invalid nodes array')
  }
  
  if (!n8nWorkflow.name) {
    errors.push('Invalid workflow: missing name')
  }
  
  // Check for unsupported node types
  for (const node of n8nWorkflow.nodes || []) {
    if (!N8N_TO_NEXUS_MAP[node.type] && !node.type.startsWith('n8n-nodes-base.')) {
      warnings.push(`Unsupported node type: ${node.type}. Will use as-is.`)
    }
  }
  
  // Check for unsupported credential types
  for (const node of n8nWorkflow.nodes || []) {
    if (node.credentials) {
      for (const credType of Object.keys(node.credentials)) {
        if (!N8N_CREDENTIAL_MAP[credType]) {
          warnings.push(`Unsupported credential type: ${credType}. Manual configuration required.`)
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
