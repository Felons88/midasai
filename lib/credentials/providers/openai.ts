/**
 * OpenAI Provider
 */

import type { CredentialProvider, ConnectionTestResult } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const openaiProvider: CredentialProvider = {
  config: {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    category: 'ai',
    documentationUrl: 'https://platform.openai.com/docs/api-reference/authentication',
    rateLimitInfo: 'Rate limits vary by tier. Check your account dashboard.',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 'sk-...',
        validation: /^sk-[a-zA-Z0-9]{20,}$/,
        validationMessage: 'Must start with sk- followed by at least 20 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^sk-[a-zA-Z0-9]{20,}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid OpenAI API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to OpenAI',
          metadata: {
            organization: result.data?.organization || undefined
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to OpenAI',
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
