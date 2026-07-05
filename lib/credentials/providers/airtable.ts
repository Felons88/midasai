/**
 * Airtable Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const airtableProvider: CredentialProvider = {
  config: {
    id: 'airtable',
    name: 'Airtable',
    icon: '📊',
    category: 'database',
    documentationUrl: 'https://airtable.com/developers/web/api/introduction',
    rateLimitInfo: '5 requests per second per base',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 'pat...',
        validation: /^pat[a-zA-Z0-9._-]{14,}$/,
        validationMessage: 'Must be a valid Airtable personal access token'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^pat[a-zA-Z0-9._-]{14,}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid Airtable API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.airtable.com/v0/meta/whoami', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Airtable',
          metadata: {
            email: result.data?.email || undefined,
            id: result.data?.id || undefined
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Airtable',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        status: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  },

  normalize(fields) {
    return {
      apiKey: fields.apiKey?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { apiKey: value }
    }
  }
}
