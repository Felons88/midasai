/**
 * n8n to Nexus Workflow Converter
 * 
 * Converts n8n workflow JSON to Nexus workflow format.
 * Handles node type mapping, credential references, and expression transformation.
 */

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from './types'

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
  connections?: Record<string, Record<string, Array<{ node: string; type: string; index: number }>>>
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
  
  // Database
  'n8n-nodes-base.postgres': 'db.postgres',
  'n8n-nodes-base.mysql': 'db.mysql',
  'n8n-nodes-base.mongodb': 'db.mongodb',
  'n8n-nodes-base.redis': 'db.redis',
  'n8n-nodes-base.supabase': 'db.supabase',
  
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
  
  // Utility
  'n8n-nodes-base.wait': 'util.wait',
  'n8n-nodes-base.noOp': 'util.noop',
  'n8n-nodes-base.stopAndError': 'util.error',
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

/**
 * Converts n8n connections to Nexus edges
 */
function convertConnections(
  connections: Record<string, Record<string, Array<{ node: string; type: string; index: number }>>>,
  nodeMap: Map<string, string>
): WorkflowEdge[] {
  const edges: WorkflowEdge[] = []
  let edgeId = 0
  
  for (const [sourceNodeName, outputConnections] of Object.entries(connections)) {
    const sourceNodeId = nodeMap.get(sourceNodeName)
    if (!sourceNodeId) continue
    
    for (const [outputName, targets] of Object.entries(outputConnections)) {
      for (const target of targets) {
        const targetNodeId = nodeMap.get(target.node)
        if (!targetNodeId) continue
        
        edges.push({
          id: `edge-${edgeId++}`,
          source_node_id: sourceNodeId,
          source_output: outputName,
          target_node_id: targetNodeId,
          target_input: 'input'
        })
      }
    }
  }
  
  return edges
}

/**
 * Main conversion function
 */
export function convertN8nToNexus(n8nWorkflow: N8nWorkflow): WorkflowDefinition {
  const nodeMap = new Map<string, string>()
  const nodes: WorkflowNode[] = []
  let nodeId = 0
  
  // Convert nodes
  for (const n8nNode of n8nWorkflow.nodes) {
    const nexusNodeType = N8N_TO_NEXUS_MAP[n8nNode.type] || n8nNode.type.replace('n8n-nodes-base.', '')
    
    const nexusNode: WorkflowNode = {
      id: `node-${nodeId++}`,
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
    nodeMap.set(n8nNode.name, nexusNode.id)
  }
  
  // Convert connections
  const edges = convertConnections(n8nWorkflow.connections || {}, nodeMap)
  
  // Convert settings
  const settings = {
    timeout_ms: n8nWorkflow.settings?.executionTimeout || 30000,
    max_retries: n8nWorkflow.settings?.retryCount || 3,
    concurrency: 1
  }
  
  return {
    nodes,
    edges,
    settings
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
