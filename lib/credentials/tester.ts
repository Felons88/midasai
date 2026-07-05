/**
 * CredentialTester - Tests credential connections via real API calls
 */

import type { ConnectionTestResult, ProviderType } from './provider-types'
import { providerRegistry } from './provider-registry'

/**
 * Test a credential connection by calling the provider's test method
 */
export async function testCredential(
  provider: ProviderType,
  fields: Record<string, string>
): Promise<ConnectionTestResult> {
  const providerImpl = providerRegistry.get(provider)
  
  if (!providerImpl) {
    return {
      success: false,
      status: 'invalid',
      message: `Unknown provider: ${provider}`,
      timestamp: new Date().toISOString()
    }
  }

  try {
    const result = await providerImpl.test(fields)
    return result
  } catch (error) {
    return {
      success: false,
      status: 'network_error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: {
        type: error instanceof Error ? error.constructor.name : 'Error',
        details: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Helper function to make HTTP requests for connection testing
 */
export async function testHttpRequest(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const data = await response.json().catch(() => null)

    if (response.ok) {
      return { success: true, status: response.status, data }
    }

    return {
      success: false,
      status: response.status,
      error: data?.error || data?.message || `HTTP ${response.status}`
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, status: 0, error: 'Request timeout' }
      }
      return { success: false, status: 0, error: error.message }
    }
    return { success: false, status: 0, error: 'Unknown error' }
  }
}

/**
 * Determine connection status from HTTP response
 */
export function getStatusFromHttpStatus(status: number): ConnectionTestResult['status'] {
  if (status >= 200 && status < 300) return 'connected'
  if (status === 401) return 'invalid'
  if (status === 403) return 'invalid'
  if (status === 404) return 'invalid'
  if (status >= 400 && status < 500) return 'failed'
  if (status >= 500) return 'network_error'
  return 'unknown'
}

/**
 * Extract user/account info from common API response formats
 */
export function extractUserInfo(data: any): { user?: string; workspace?: string; organization?: string } {
  const info: { user?: string; workspace?: string; organization?: string } = {}

  // Try common field names
  if (data?.login) info.user = data.login
  else if (data?.username) info.user = data.username
  else if (data?.email) info.user = data.email
  else if (data?.user?.login) info.user = data.user.login
  else if (data?.user?.username) info.user = data.user.username
  else if (data?.user?.email) info.user = data.user.email

  if (data?.workspace) info.workspace = data.workspace
  else if (data?.team) info.workspace = data.team
  else if (data?.workspace_name) info.workspace = data.workspace_name

  if (data?.organization) info.organization = data.organization
  else if (data?.org) info.organization = data.org
  else if (data?.organization_name) info.organization = data.organization_name

  return info
}
