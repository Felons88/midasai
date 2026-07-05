/**
 * Linear Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const linearProvider: CredentialProvider = {
  config: {
    id: 'linear',
    name: 'Linear',
    icon: '📊',
    category: 'dev',
    documentationUrl: 'https://developers.linear.app/docs/graphql-api',
    rateLimitInfo: 'Rate limits: 200 requests per minute for authenticated requests',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 'lin_api_...',
        validation: /^lin_api_[a-zA-Z0-9]{32}$/,
        validationMessage: 'Must start with lin_api_ followed by 32 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^lin_api_[a-zA-Z0-9]{32}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid Linear API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'query { viewer { id } }'
        })
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Linear',
          metadata: {
            user: result.data?.data?.viewer?.id
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Linear',
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
