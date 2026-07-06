/**
 * N8N Node Metadata Scraper
 * 
 * Scrapes node metadata from the official n8n GitHub repository
 * to build a comprehensive node registry for MidasAI Nexus.
 */

interface N8NNodeMetadata {
  name: string;
  displayName: string;
  description: string;
  category: string;
  inputs: any[];
  outputs: any[];
  credentials?: string[];
  version: string;
  icon?: string;
  n8nAlias: string;
  nodePath: string;
}

interface N8NNodeJson {
  node?: string;
  nodeVersion?: string;
  codexVersion?: string;
  categories?: string[];
  subcategories?: Record<string, string[]>;
  alias?: string[];
  resources?: any;
  name?: string;
  displayName?: string;
  description?: string;
  group?: string[];
  version?: number;
  defaults?: {
    name?: string;
    color?: string;
    icon?: string;
  };
  inputs?: string[];
  outputs?: string[];
  credentials?: any[];
  properties?: any[];
}

const N8N_REPO = 'n8n-io/n8n';
const NODES_BASE_PATH = 'packages/nodes-base/nodes';

/**
 * Fetches the directory tree of n8n nodes-base using GitHub API
 */
async function fetchN8NNodeDirectories(): Promise<string[]> {
  const response = await fetch(
    `https://api.github.com/repos/${N8N_REPO}/git/trees/HEAD?recursive=1`
  );
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const tree = data.tree;
  
  // Filter for node directories (containing .node.json files)
  const nodePaths = tree
    .filter((item: any) => 
      item.path.startsWith(NODES_BASE_PATH) && 
      item.path.endsWith('.node.json')
    )
    .map((item: any) => item.path);
  
  return nodePaths;
}

/**
 * Fetches and parses a single .node.json file
 */
async function fetchNodeJson(nodePath: string): Promise<N8NNodeJson | null> {
  const url = `https://raw.githubusercontent.com/${N8N_REPO}/master/${nodePath}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${nodePath}: ${response.statusText}`);
      return null;
    }
    
    const json = await response.json();
    return json;
  } catch (error) {
    console.warn(`Error parsing ${nodePath}:`, error);
    return null;
  }
}

/**
 * Extracts node metadata from .node.json structure
 */
function extractMetadata(nodeJson: N8NNodeJson, nodePath: string): N8NNodeMetadata {
  // Extract node name from path (e.g., "packages/nodes-base/nodes/Gmail/Gmail.node.json" -> "Gmail")
  const pathParts = nodePath.split('/');
  const nodeName = pathParts[pathParts.length - 1].replace('.node.json', '');
  
  // Use n8n's node field if available, otherwise generate from path
  const n8nAlias = nodeJson.node || `n8n-nodes-base.${nodeName.toLowerCase()}`;
  
  // Determine category from categories array or group or defaults
  const category = nodeJson.categories?.[0] || nodeJson.group?.[0] || 'utility';
  
  return {
    name: nodeName,
    displayName: nodeJson.displayName || nodeJson.name || nodeName,
    description: nodeJson.description || '',
    category,
    inputs: nodeJson.inputs || ['main'],
    outputs: nodeJson.outputs || ['main'],
    credentials: nodeJson.credentials?.map((c: any) => c.name) || [],
    version: nodeJson.nodeVersion?.toString() || nodeJson.version?.toString() || '1.0.0',
    icon: nodeJson.defaults?.icon,
    n8nAlias,
    nodePath,
  };
}

/**
 * Maps n8n categories to MidasAI categories
 */
function mapN8NCategoryToMidasAI(n8nCategory: string): string {
  const categoryMap: Record<string, string> = {
    'communication': 'communication',
    'crm': 'crm',
    'productivity': 'productivity',
    'development': 'developer',
    'data': 'data',
    'logic': 'logic',
    'trigger': 'trigger',
    'automation': 'automation',
    'ai': 'ai',
    'cloud': 'cloud',
    'database': 'database',
    'eCommerce': 'ecommerce',
    'marketing': 'marketing',
    'projectManagement': 'project',
    'social': 'social',
    'file': 'file',
    'security': 'security',
    'utility': 'utility',
  };
  
  // Try exact match first
  if (categoryMap[n8nCategory]) {
    return categoryMap[n8nCategory];
  }
  
  // Try case-insensitive match
  const lowerCategory = n8nCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (key.toLowerCase() === lowerCategory) {
      return value;
    }
  }
  
  // Default to utility
  return 'utility';
}

/**
 * Main scraping function
 */
export async function scrapeN8NNodes(): Promise<N8NNodeMetadata[]> {
  console.log('Starting n8n node metadata scrape...');
  
  // Fetch all node directory paths
  const nodePaths = await fetchN8NNodeDirectories();
  console.log(`Found ${nodePaths.length} node files`);
  
  const allMetadata: N8NNodeMetadata[] = [];
  
  // Process each node file
  for (const nodePath of nodePaths) {
    const nodeJson = await fetchNodeJson(nodePath);
    
    if (nodeJson) {
      const metadata = extractMetadata(nodeJson, nodePath);
      metadata.category = mapN8NCategoryToMidasAI(metadata.category);
      allMetadata.push(metadata);
      console.log(`Processed: ${metadata.name} (${metadata.n8nAlias})`);
    }
  }
  
  console.log(`Scraped ${allMetadata.length} nodes successfully`);
  return allMetadata;
}

/**
 * Generates TypeScript code for NodeDefinition from metadata
 */
export function generateNodeDefinition(metadata: N8NNodeMetadata): string {
  const { name, displayName, description, category, n8nAlias, icon } = metadata;
  
  // Generate a simple ID based on category and name
  const id = `${category}.${name.toLowerCase().replace(/\s+/g, '_')}`;
  
  return `  {
    id: "${id}",
    name: "${displayName}",
    description: "${description.replace(/"/g, '\\"')}",
    category: "${category}",
    icon: "${icon || '⚙️'}",
    color: "#6366f1",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Data", "object")],
    outputs: [D("data_out", "Data", "object")],
    n8nAliases: ["${n8nAlias}"],
    n8nVersion: "0.20.0",
    fields: [],
    executor: "placeholder",
    tags: ["ai-generated", "placeholder", "n8n"],
  },`;
}

// CLI execution
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  scrapeN8NNodes()
    .then((metadata) => {
      // Save metadata as JSON
      const metadataPath = path.join(__dirname, 'n8n-node-metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`\nSaved ${metadata.length} node metadata entries to ${metadataPath}`);
      
      // Generate TypeScript definitions
      const definitionsPath = path.join(__dirname, 'n8n-node-definitions.ts');
      const definitions = metadata.map(generateNodeDefinition).join('\n');
      const tsContent = `// Auto-generated n8n node definitions\n// Generated: ${new Date().toISOString()}\n\nimport { D } from './node-registry';\n\nexport const n8nNodeDefinitions: any[] = [\n${definitions}\n];\n`;
      fs.writeFileSync(definitionsPath, tsContent);
      console.log(`Saved TypeScript definitions to ${definitionsPath}`);
      
      console.log('\n=== Scraping Complete ===');
      console.log(`Total nodes scraped: ${metadata.length}`);
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}
