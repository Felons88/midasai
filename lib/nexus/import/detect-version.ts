/**
 * Stage 2: Version Detection
 * Detects n8n workflow version and selects appropriate conversion rules
 */

import type { N8nWorkflow } from './types'

export interface WorkflowVersion {
  major: number
  minor: number
  patch: number
  formatted: string
  detectedFrom: 'metadata' | 'node-version' | 'default'
}

/**
 * Detects the n8n version from workflow metadata
 * @param workflow Validated n8n workflow
 * @returns Detected version information
 */
export function detectN8nVersion(workflow: N8nWorkflow): WorkflowVersion {
  // Try to detect from workflow metadata
  if (workflow.version) {
    if (typeof workflow.version === 'string') {
      const parsed = parseVersionString(workflow.version)
      if (parsed) {
        return {
          ...parsed,
          detectedFrom: 'metadata'
        }
      }
    } else if (typeof workflow.version === 'number') {
      return {
        major: workflow.version,
        minor: 0,
        patch: 0,
        formatted: `${workflow.version}.0.0`,
        detectedFrom: 'metadata'
      }
    }
  }
  
  // Try to detect from node typeVersions
  if (workflow.nodes && workflow.nodes.length > 0) {
    const typeVersions = workflow.nodes
      .map(n => n.typeVersion)
      .filter((v): v is number => v !== undefined && typeof v === 'number')
    
    if (typeVersions.length > 0) {
      const avgVersion = typeVersions.reduce((a, b) => a + b, 0) / typeVersions.length
      // Map typeVersion ranges to n8n versions
      // typeVersion 1-3: n8n 0.x
      // typeVersion 4-6: n8n 1.x
      // typeVersion 7+: n8n 2.x
      let major = 1
      if (avgVersion < 4) major = 0
      else if (avgVersion >= 7) major = 2
      
      return {
        major,
        minor: 0,
        patch: 0,
        formatted: `${major}.0.0`,
        detectedFrom: 'node-version'
      }
    }
  }
  
  // Default to latest stable version
  return {
    major: 1,
    minor: 0,
    patch: 0,
    formatted: '1.0.0',
    detectedFrom: 'default'
  }
}

/**
 * Parses a version string like "1.0.0" or "1.0"
 */
function parseVersionString(version: string): WorkflowVersion | null {
  const parts = version.split('.').map(p => parseInt(p, 10))
  
  if (parts.length === 0 || parts.some(isNaN)) {
    return null
  }
  
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    formatted: version,
    detectedFrom: 'metadata'
  }
}

/**
 * Checks if a workflow version is supported for import
 * @param version Detected workflow version
 * @returns true if supported, false otherwise
 */
export function isVersionSupported(version: WorkflowVersion): boolean {
  // Support n8n 0.20.0+ and all 1.x and 2.x versions
  // Also support 0.0.0 (default/unknown version) - treat as compatible
  if (version.major === 0 && version.minor < 20 && !(version.major === 0 && version.minor === 0 && version.patch === 0)) {
    return false
  }
  
  return true
}

/**
 * Gets breaking changes between n8n versions
 * @param fromVersion Source n8n version
 * @param toVersion Target n8n version (Nexus equivalent)
 * @returns Array of breaking change descriptions
 */
export function getBreakingChanges(fromVersion: WorkflowVersion, toVersion: WorkflowVersion): string[] {
  const changes: string[] = []
  
  // 0.x to 1.x breaking changes
  if (fromVersion.major === 0 && toVersion.major >= 1) {
    changes.push('Node execution model changed from v0 to v1')
    changes.push('Expression syntax updated')
    changes.push('Credential system restructured')
    changes.push('Connection format changed')
  }
  
  // 1.x to 2.x breaking changes
  if (fromVersion.major === 1 && toVersion.major >= 2) {
    changes.push('Node parameters structure updated')
    changes.push('New expression functions added')
    changes.push('Trigger node behavior changed')
  }
  
  return changes
}
