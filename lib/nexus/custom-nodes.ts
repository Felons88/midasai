import { createClient } from '@/lib/supabase/server'
import type { NodeDefinition, NodeCategory, NodePort, NodeField } from './node-registry'
import { registerCustomNode } from './node-registry'

function normalizeCategory(value: string): NodeCategory {
  const allowed: NodeCategory[] = [
    'ai', 'llm', 'image', 'audio', 'developer', 'database', 'cloud', 'logic', 'files',
    'midas', 'analytics', 'browser', 'ide', 'communication', 'data', 'devops', 'finance',
    'crm', 'utility'
  ]
  const lower = (value || 'utility').toLowerCase()
  return allowed.find(c => c === lower) || 'utility'
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

function toNodeDefinition(row: Record<string, unknown>): NodeDefinition {
  return {
    id: String(row.nexus_id),
    name: String(row.name),
    description: String(row.description || ''),
    category: normalizeCategory(String(row.category)),
    icon: String(row.icon || '⚙️'),
    color: String(row.color || '#a3a3a3'),
    inputs: asArray<NodePort>(row.inputs),
    outputs: asArray<NodePort>(row.outputs),
    credentials: asArray<string>(row.credentials),
    fields: asArray<NodeField>(row.fields),
    executor: String(row.executor || 'noop'),
    tags: asArray<string>(row.tags),
    docs: row.docs ? String(row.docs) : undefined,
  }
}

/**
 * Loads all custom nodes from the database into the in-memory custom node registry.
 * Safe to call multiple times; duplicate registrations replace the previous entry.
 */
export async function loadCustomNodes(): Promise<NodeDefinition[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nexus_custom_nodes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load custom nodes:', error.message)
    return []
  }

  const defs = (data || []).map(toNodeDefinition)
  for (const def of defs) {
    registerCustomNode(def)
  }
  return defs
}

/**
 * Saves a custom node definition to the database and registers it.
 */
export async function saveCustomNode(def: NodeDefinition, n8nType: string): Promise<NodeDefinition> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nexus_custom_nodes')
    .upsert(
      {
        n8n_type: n8nType,
        nexus_id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        color: def.color,
        inputs: def.inputs,
        outputs: def.outputs,
        fields: def.fields,
        credentials: def.credentials,
        executor: def.executor,
        tags: def.tags,
        definition: def,
      },
      { onConflict: 'n8n_type' }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save custom node: ${error.message}`)
  }

  const saved = toNodeDefinition(data as Record<string, unknown>)
  registerCustomNode(saved)
  return saved
}
