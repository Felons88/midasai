/**
 * Groq Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const groqProvider: CredentialProvider = {
  config: {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    category: 'ai',
    documentationUrl: 'https://console.groq.com/docs/quickstart',
    rateLimitInfo: 'Rate limits vary by tier. Check your account dashboard.',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 'gsk_...',
        validation: /^gsk_[a-zA-Z0-9]{40,}$/,
        validationMessage: 'Must start with gsk_ followed by at least 40 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^gsk_[a-zA-Z0-9]{40,}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid Groq API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Groq',
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Groq',
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
