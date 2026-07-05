/**
 * Google AI Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const googleAiProvider: CredentialProvider = {
  config: {
    id: 'google-ai',
    name: 'Google AI',
    icon: '🔍',
    category: 'ai',
    documentationUrl: 'https://ai.google.dev/docs',
    rateLimitInfo: 'Rate limits vary by model. Check your account dashboard.',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 'AIza...',
        validation: /^AIza[a-zA-Z0-9\-_]{35}$/,
        validationMessage: 'Must start with AIza followed by 35 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^AIza[a-zA-Z0-9\-_]{35}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid Google AI API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Google AI',
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Google AI',
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
