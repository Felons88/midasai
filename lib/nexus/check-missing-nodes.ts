/**
 * Check Missing Nodes Script
 * 
 * Scans n8n workflow JSON files and identifies nodes that are not
 * present in the Nexus node registry. Results are logged to a markdown file.
 */

import fs from 'fs'
import path from 'path'
import { NODE_REGISTRY } from './node-registry'
import type { NodeDefinition } from './node-registry'

// Paths
const WORKFLOWS_DIR = path.join(process.cwd(), 'lib/nexus/n8n-workflows')
const OUTPUT_FILE = path.join(process.cwd(), 'lib/nexus/MISSING_NODES.md')
const METADATA_FILE = path.join(process.cwd(), 'lib/nexus/n8n-node-metadata.json')

// Load n8n metadata for reference
let n8nMetadata: any[] = []
try {
  const metadataContent = fs.readFileSync(METADATA_FILE, 'utf-8')
  n8nMetadata = JSON.parse(metadataContent)
} catch (error) {
  console.warn('Could not load n8n metadata:', error)
}

// Get all n8nAliases from registry
const registryAliases = new Set<string>()
for (const node of NODE_REGISTRY) {
  if (node.n8nAliases) {
    node.n8nAliases.forEach(alias => registryAliases.add(alias))
  }
}

// Get all n8n node names from metadata
const metadataNodeNames = new Set<string>()
for (const meta of n8nMetadata) {
  if (meta.name) {
    metadataNodeNames.add(meta.name.toLowerCase())
  }
  if (meta.n8nAlias) {
    // Extract node name from alias (n8n-nodes-base.nodename)
    const match = meta.n8nAlias.match(/n8n-nodes-base\.(.+)/)
    if (match) {
      metadataNodeNames.add(match[1].toLowerCase())
    }
  }
}

interface MissingNode {
  nodeName: string
  source: string
  foundInMetadata: boolean
  metadata?: any
  workflows: string[]
}

const missingNodes = new Map<string, MissingNode>()

/**
 * Extract node types from n8n workflow JSON
 */
function extractNodeTypes(workflowJson: any): string[] {
  const nodeTypes = new Set<string>()
  
  if (workflowJson.nodes) {
    for (const node of workflowJson.nodes) {
      if (node.type) {
        // Handle n8n node type format: n8n-nodes-base.nodeName
        const match = node.type.match(/n8n-nodes-base\.(.+)/)
        if (match) {
          nodeTypes.add(match[1])
        } else {
          // Add as-is if it doesn't match the pattern
          nodeTypes.add(node.type)
        }
      }
    }
  }
  
  return Array.from(nodeTypes)
}

/**
 * Check if a node is in the registry
 */
function isNodeInRegistry(nodeName: string): boolean {
  // Check direct alias match
  if (registryAliases.has(`n8n-nodes-base.${nodeName}`)) {
    return true
  }
  
  // Check node name match (case-insensitive)
  const lowerName = nodeName.toLowerCase()
  for (const alias of registryAliases) {
    if (alias.toLowerCase().includes(lowerName)) {
      return true
    }
  }
  
  return false
}

/**
 * Process a single workflow file
 */
function processWorkflowFile(filePath: string, fileName: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const workflowJson = JSON.parse(content)
    
    const nodeTypes = extractNodeTypes(workflowJson)
    
    for (const nodeType of nodeTypes) {
      const normalizedName = nodeType.toLowerCase()
      
      if (!isNodeInRegistry(normalizedName)) {
        if (!missingNodes.has(normalizedName)) {
          const foundInMetadata = metadataNodeNames.has(normalizedName)
          const metadata = n8nMetadata.find(m => 
            m.name?.toLowerCase() === normalizedName || 
            m.n8nAlias?.toLowerCase() === `n8n-nodes-base.${normalizedName}`
          )
          
          missingNodes.set(normalizedName, {
            nodeName: nodeType,
            source: 'workflow',
            foundInMetadata,
            metadata,
            workflows: [fileName]
          })
        } else {
          const existing = missingNodes.get(normalizedName)!
          if (!existing.workflows.includes(fileName)) {
            existing.workflows.push(fileName)
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error)
  }
}

/**
 * Scan all workflow JSON files
 */
function scanWorkflowFiles(): void {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    console.log(`Workflows directory not found: ${WORKFLOWS_DIR}`)
    console.log('Creating directory for sample workflows...')
    fs.mkdirSync(WORKFLOWS_DIR, { recursive: true })
    return
  }
  
  const files = fs.readdirSync(WORKFLOWS_DIR)
  const jsonFiles = files.filter(f => f.endsWith('.json'))
  
  console.log(`Scanning ${jsonFiles.length} workflow files...`)
  
  for (const file of jsonFiles) {
    const filePath = path.join(WORKFLOWS_DIR, file)
    processWorkflowFile(filePath, file)
  }
}

/**
 * Check metadata for nodes not in registry
 */
function scanMetadataForMissingNodes(): void {
  console.log('Scanning n8n metadata for missing nodes...')
  
  for (const meta of n8nMetadata) {
    if (!meta.name) continue
    
    const normalizedName = meta.name.toLowerCase()
    
    if (!isNodeInRegistry(normalizedName)) {
      if (!missingNodes.has(normalizedName)) {
        missingNodes.set(normalizedName, {
          nodeName: meta.name,
          source: 'metadata',
          foundInMetadata: true,
          metadata: meta,
          workflows: []
        })
      }
    }
  }
}

/**
 * Generate markdown report
 */
function generateReport(): void {
  const lines: string[] = []
  
  lines.push('# Missing Nodes Report')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push(`Total Missing Nodes: ${missingNodes.size}`)
  lines.push('')
  
  // Group by metadata availability
  const withMetadata = Array.from(missingNodes.values()).filter(n => n.foundInMetadata)
  const withoutMetadata = Array.from(missingNodes.values()).filter(n => !n.foundInMetadata)
  
  lines.push('## Nodes Available in Metadata (Can be auto-generated)')
  lines.push('')
  lines.push(`Count: ${withMetadata.length}`)
  lines.push('')
  
  for (const node of withMetadata.sort((a, b) => a.nodeName.localeCompare(b.nodeName))) {
    lines.push(`### ${node.nodeName}`)
    lines.push('')
    lines.push(`- **n8n Alias**: n8n-nodes-base.${node.nodeName}`)
    lines.push(`- **Found in workflows**: ${node.workflows.length}`)
    lines.push(`- **Workflows**: ${node.workflows.join(', ')}`)
    
    if (node.metadata) {
      lines.push(`- **Category**: ${node.metadata.category}`)
      lines.push(`- **Description**: ${node.metadata.description}`)
    }
    lines.push('')
  }
  
  lines.push('## Nodes Not in Metadata (Manual review needed)')
  lines.push('')
  lines.push(`Count: ${withoutMetadata.length}`)
  lines.push('')
  
  for (const node of withoutMetadata.sort((a, b) => a.nodeName.localeCompare(b.nodeName))) {
    lines.push(`### ${node.nodeName}`)
    lines.push('')
    lines.push(`- **Found in workflows**: ${node.workflows.length}`)
    lines.push(`- **Workflows**: ${node.workflows.join(', ')}`)
    lines.push('')
  }
  
  lines.push('## Summary')
  lines.push('')
  lines.push(`- Total nodes scanned from workflows: ${missingNodes.size}`)
  lines.push(`- Nodes available in metadata: ${withMetadata.length}`)
  lines.push(`- Nodes requiring manual review: ${withoutMetadata.length}`)
  lines.push('')
  lines.push('## Next Steps')
  lines.push('')
  lines.push('1. Review nodes in the "Available in Metadata" section - these can be auto-generated')
  lines.push('2. For nodes in "Not in Metadata", manually check n8n repository for node definitions')
  lines.push('3. Add missing nodes to the Nexus node registry')
  lines.push('4. Re-run this script to verify completeness')
  
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'))
  console.log(`Report generated: ${OUTPUT_FILE}`)
}

/**
 * Main execution
 */
function main(): void {
  console.log('Starting missing nodes check...')
  console.log('')
  
  scanWorkflowFiles()
  scanMetadataForMissingNodes()
  
  console.log('')
  console.log(`Found ${missingNodes.size} missing nodes`)
  
  generateReport()
  
  console.log('')
  console.log('Done!')
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { main, missingNodes, generateReport }
