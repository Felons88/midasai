/**
 * Scan Storage Workflows for Missing Nodes
 * 
 * Downloads all JSON files from the n8n-workflows storage bucket,
 * parses them to extract node types, and generates missing nodes.
 */

import { createClient } from '@supabase/supabase-js'
import { NODE_REGISTRY } from './node-registry'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  utility: '#6366f1',
  marketing: '#ec4899',
  productivity: '#10b981',
  developer: '#f59e0b',
  communication: '#3b82f6',
  ai: '#8b5cf6',
  data: '#06b6d4',
  logic: '#84cc16',
  trigger: '#ef4444',
  automation: '#14b8a6',
  cloud: '#64748b',
  database: '#7c3aed',
  ecommerce: '#f97316',
  project: '#0ea5e9',
  social: '#eab308',
  file: '#8b5cf6',
  security: '#dc2626',
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  utility: '⚙️',
  marketing: '📢',
  productivity: '📊',
  developer: '💻',
  communication: '💬',
  ai: '🤖',
  data: '📊',
  logic: '🔀',
  trigger: '⚡',
  automation: '🔄',
  cloud: '☁️',
  database: '🗄️',
  ecommerce: '🛒',
  project: '📋',
  social: '👥',
  file: '📁',
  security: '🔒',
}

/**
 * Map node_type_id to category
 */
function inferCategory(nodeTypeId: string): string {
  const lowerId = nodeTypeId.toLowerCase()
  
  if (lowerId.includes('trigger') || lowerId.includes('webhook')) return 'trigger'
  if (lowerId.includes('code') || lowerId.includes('script')) return 'developer'
  if (lowerId.includes('http') || lowerId.includes('api') || lowerId.includes('request')) return 'developer'
  if (lowerId.includes('if') || lowerId.includes('switch') || lowerId.includes('merge') || lowerId.includes('split')) return 'logic'
  if (lowerId.includes('set') || lowerId.includes('transform') || lowerId.includes('convert')) return 'data'
  if (lowerId.includes('ai') || lowerId.includes('gpt') || lowerId.includes('claude') || lowerId.includes('openai')) return 'ai'
  if (lowerId.includes('database') || lowerId.includes('sql') || lowerId.includes('postgres') || lowerId.includes('mysql')) return 'database'
  if (lowerId.includes('slack') || lowerId.includes('discord') || lowerId.includes('email') || lowerId.includes('sms')) return 'communication'
  if (lowerId.includes('google') || lowerId.includes('sheets') || lowerId.includes('docs') || lowerId.includes('calendar')) return 'productivity'
  if (lowerId.includes('salesforce') || lowerId.includes('hubspot') || lowerId.includes('zendesk')) return 'crm'
  if (lowerId.includes('shopify') || lowerId.includes('stripe') || lowerId.includes('woocommerce')) return 'ecommerce'
  if (lowerId.includes('github') || lowerId.includes('gitlab') || lowerId.includes('jira')) return 'project'
  if (lowerId.includes('twitter') || lowerId.includes('facebook') || lowerId.includes('linkedin')) return 'social'
  if (lowerId.includes('aws') || lowerId.includes('azure') || lowerId.includes('gcp')) return 'cloud'
  if (lowerId.includes('file') || lowerId.includes('image') || lowerId.includes('pdf')) return 'file'
  if (lowerId.includes('auth') || lowerId.includes('security') || lowerId.includes('encrypt')) return 'security'
  
  return 'utility'
}

/**
 * Generate node ID from node_type_id
 */
function generateNodeId(nodeTypeId: string): string {
  const category = inferCategory(nodeTypeId)
  const normalizedName = nodeTypeId.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return `${category}.${normalizedName}`
}

/**
 * Generate NodeDefinition code
 */
function generateNodeDefinition(nodeTypeId: string): string {
  const category = inferCategory(nodeTypeId)
  const id = generateNodeId(nodeTypeId)
  const displayName = nodeTypeId.split('.').pop() || nodeTypeId
  const description = `${displayName} node from n8n workflow import`
  const icon = CATEGORY_ICONS[category] || '⚙️'
  const color = CATEGORY_COLORS[category] || '#6366f1'
  
  // Determine if it's a trigger node
  const isTrigger = nodeTypeId.toLowerCase().includes('trigger') || 
                   nodeTypeId.toLowerCase().includes('webhook') ||
                   category === 'trigger'
  
  // Generate inputs/outputs based on type
  const inputs = isTrigger ? [] as any[] : [
    { id: "trigger", label: "Trigger", type: "trigger" as const },
    { id: "data", label: "Data", type: "any" as const }
  ]
  const outputs = isTrigger ? [
    { id: "output", label: "Output", type: "any" as const }
  ] : [
    { id: "output", label: "Output", type: "object" as const }
  ]
  
  // Generate tags
  const tags = ['ai-generated', 'placeholder', 'storage-import']
  if (isTrigger) tags.push('trigger')
  tags.push(category)
  
  // Generate inputs/outputs code directly
  const inputsCode = inputs.length === 0 ? '[]' : inputs.map(i => 
    `{ id: "${i.id}", label: "${i.label}", type: "${i.type}" as const }`
  ).join(', ')
  
  const outputsCode = outputs.map(o => 
    `{ id: "${o.id}", label: "${o.label}", type: "${o.type}" as const }`
  ).join(', ')
  
  const tagsStr = tags.map(t => `"${t}"`).join(', ')
  
  // Map to executor key - use existing N8N_TO_NEXUS_MAP if available
  const n8nAlias = `n8n-nodes-base.${displayName}`
  let executorKey: string
  
  // Try to use existing N8N_TO_NEXUS_MAP for consistency
  const N8N_TO_NEXUS_MAP: Record<string, string> = {
    'n8n-nodes-base.stickyNote': 'stickynote',
    'n8n-nodes-base.httpRequest': 'http_request',
    'n8n-nodes-base.if': 'if_condition',
    'n8n-nodes-base.set': 'set_vars',
    'n8n-nodes-base.function': 'function',
    'n8n-nodes-base.code': 'code_exec',
    'n8n-nodes-base.filter': 'filter',
    'n8n-nodes-base.merge': 'merge',
    'n8n-nodes-base.switch': 'switch',
    'n8n-nodes-base.wait': 'wait',
    'n8n-nodes-base.noOp': 'no_op',
    'n8n-nodes-base.stopAndError': 'stop_and_error',
    'n8n-nodes-base.splitOut': 'split_out',
    'n8n-nodes-base.splitInBatches': 'split_in_batches',
    'n8n-nodes-base.respondToWebhook': 'respond_to_webhook',
    'n8n-nodes-base.aggregate': 'aggregate',
    'n8n-nodes-base.itemLists': 'item_lists',
    'n8n-nodes-base.limit': 'limit',
    'n8n-nodes-base.webhook': 'webhook',
    'n8n-nodes-base.manualTrigger': 'manual_trigger',
    'n8n-nodes-base.executeWorkflow': 'execute_workflow',
    'n8n-nodes-base.formTrigger': 'form_trigger',
    'n8n-nodes-base.convertToFile': 'convert_to_file',
    'n8n-nodes-base.extractFromFile': 'extract_from_file',
    'n8n-nodes-base.gmail': 'gmail',
    'n8n-nodes-base.gmailTrigger': 'gmail_trigger',
    'n8n-nodes-base.googleSheets': 'google_sheets',
    'n8n-nodes-base.googleDrive': 'google_drive',
    'n8n-nodes-base.googleCalendar': 'google_calendar',
    'n8n-nodes-base.redis': 'redis',
    'n8n-nodes-base.postgres': 'postgres',
    'n8n-nodes-base.hubspot': 'hubspot',
    'n8n-nodes-base.n8n': 'n8n',
    'n8n-nodes-base.jira': 'jira',
    'n8n-nodes-base.microsoftOutlook': 'microsoft_outlook',
    'n8n-nodes-base.openAi': 'openai',
    'n8n-nodes-base.telegram': 'telegram',
    'n8n-nodes-base.telegramTrigger': 'telegram_trigger',
    'n8n-nodes-base.supabase': 'supabase',
    'n8n-nodes-base.spotify': 'spotify',
    'n8n-nodes-base.pipedrive': 'pipedrive',
    'n8n-nodes-base.discord': 'discord',
    'n8n-nodes-base.dateTime': 'date_time',
    'n8n-nodes-base.sort': 'sort',
    'n8n-nodes-base.rssFeedRead': 'rss_feed_read',
    'n8n-nodes-base.removeDuplicates': 'remove_duplicates',
    'n8n-nodes-base.executeCommand': 'execute_command',
    'n8n-nodes-base.mysql': 'mysql',
    'n8n-nodes-base.googleDocs': 'google_docs',
    'n8n-nodes-base.nocoDB': 'nocodb',
    'n8n-nodes-base.zendesk': 'zendesk',
    'n8n-nodes-base.todoist': 'todoist',
    'n8n-nodes-base.xml': 'xml',
    'n8n-nodes-base.twitter': 'twitter',
    'n8n-nodes-base.twilio': 'twilio',
    'n8n-nodes-base.crypto': 'crypto',
    'n8n-nodes-base.dropbox': 'dropbox',
    'n8n-nodes-base.graphql': 'graphql',
    'n8n-nodes-base.airtable': 'airtable',
    'n8n-nodes-base.editImage': 'edit_image',
    'n8n-nodes-base.mattermost': 'mattermost',
    'n8n-nodes-base.youtube': 'youtube',
    'n8n-nodes-base.functionItem': 'function_item',
    'n8n-nodes-base.wordpress': 'wordpress',
    'n8n-nodes-base.summarize': 'summarize',
    'n8n-nodes-base.whatsapp': 'whatsapp',
    'n8n-nodes-base.readBinaryFile': 'read_binary_file',
    'n8n-nodes-base.clockify': 'clockify',
    'n8n-nodes-base.stripe': 'stripe',
    'n8n-nodes-base.linear': 'linear',
    'n8n-nodes-base.mongodb': 'mongo_db',
    'n8n-nodes-base.slack': 'slack',
    'n8n-nodes-base.notion': 'notion',
    'n8n-nodes-base.html': 'html',
    'n8n-nodes-base.htmlExtract': 'htmlextract',
    'n8n-nodes-base.markdown': 'markdown',
    'n8n-nodes-base.scheduleTrigger': 'schedule',
    'n8n-nodes-base.cron': 'cron',
    'n8n-nodes-base.form': 'form',
    'n8n-nodes-base.readWriteFile': 'read_write_file',
  }
  
  if (N8N_TO_NEXUS_MAP[n8nAlias]) {
    executorKey = N8N_TO_NEXUS_MAP[n8nAlias]
  } else {
    // Fallback to auto-generated key
    executorKey = displayName
      .replace(/([A-Z])/g, (m) => m.toLowerCase())
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '')
  }
  
  return `  {
    id: "${id}",
    name: "${displayName}",
    description: "${description.replace(/"/g, '\\"')}",
    category: "${category}" as NodeCategory,
    icon: "${icon}",
    color: "${color}",
    inputs: [${inputsCode}],
    outputs: [${outputsCode}],
    n8nAliases: ["n8n-nodes-base.${displayName}"],
    n8nVersion: "1.0",
    fields: [],
    executor: "${executorKey}",
    tags: [${tagsStr}],
  },`
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('Scanning n8n-workflows storage bucket for missing nodes...')
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Force regenerate all nodes with correct executor keys
  console.log('Regenerating all nodes with correct executor mappings...')
  
  // List all files in n8n-workflows bucket recursively
  // Need to list each directory separately since Supabase storage list doesn't recurse
  const { data: topLevelItems, error: listError } = await supabase
    .storage
    .from('n8n-workflows')
    .list('', { limit: 1000 })
  
  if (listError) {
    console.error('Error listing files:', listError)
    process.exit(1)
  }
  
  console.log(`Found ${topLevelItems.length} top-level items`)
  
  // Collect all JSON file paths
  const allJsonFiles: string[] = []
  
  for (const item of topLevelItems) {
    if (item.id === null) {
      // It's a folder, list its contents
      const { data: folderContents, error: folderError } = await supabase
        .storage
        .from('n8n-workflows')
        .list(item.name, { limit: 1000 })
      
      if (folderError) {
        console.error(`Error listing folder ${item.name}:`, folderError)
        continue
      }
      
      for (const file of folderContents) {
        if (file.name.endsWith('.json')) {
          allJsonFiles.push(`${item.name}/${file.name}`)
        }
      }
    } else if (item.name.endsWith('.json')) {
      // It's a JSON file at root level
      allJsonFiles.push(item.name)
    }
  }
  
  console.log(`Found ${allJsonFiles.length} JSON files in storage`)
  
  // Debug: show first few file names
  console.log('Sample file names:', allJsonFiles.slice(0, 5))
  
  // Collect all unique node_type_id values
  const nodeTypeIds = new Set<string>()
  let processedFiles = 0
  
  for (const filePath of allJsonFiles) {
    try {
      // Download file
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('n8n-workflows')
        .download(filePath)
      
      if (downloadError) {
        console.error(`Error downloading ${filePath}:`, downloadError)
        continue
      }
      
      // Parse JSON
      const text = await fileData.text()
      const workflow = JSON.parse(text)
      
      // Extract node types from n8n format
      if (workflow.nodes) {
        for (const node of workflow.nodes) {
          if (node.type) {
            // n8n uses "type" field
            nodeTypeIds.add(node.type)
          }
        }
      }
      
      processedFiles++
      if (processedFiles % 50 === 0) {
        console.log(`Processed ${processedFiles}/${allJsonFiles.length} files...`)
      }
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e)
    }
  }
  
  console.log(`Processed ${processedFiles} files`)
  console.log(`Found ${nodeTypeIds.size} unique node types`)
  
  // Generate nodes for ALL found types with correct executor keys
  const nodeTypes = [...nodeTypeIds].sort()
  console.log(`Generating node definitions for ${nodeTypes.length} node types...`)
  
  // Generate node definitions for all types
  const nodeDefinitions = nodeTypes.map(generateNodeDefinition)
  
  const header = `// Auto-generated nodes from n8n-workflows storage bucket
// Generated: ${new Date().toISOString()}
// Total nodes: ${nodeTypes.length}
// These nodes should be appended to the NODE_REGISTRY array in node-registry.ts

export const STORAGE_MISSING_NODES = [
${nodeDefinitions.join('\n')}
]
`
  
  const outputFile = path.join(process.cwd(), 'lib/nexus/storage-missing-nodes.ts')
  fs.writeFileSync(outputFile, header)
  
  console.log(``)
  console.log(`Written to: ${outputFile}`)
  console.log(``)
  console.log('Next steps:')
  console.log('1. Review the generated nodes in lib/nexus/storage-missing-nodes.ts')
  console.log('2. Import STORAGE_MISSING_NODES in lib/nexus/node-registry.ts')
  console.log('3. Spread STORAGE_MISSING_NODES into NODE_REGISTRY array')
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { main }
