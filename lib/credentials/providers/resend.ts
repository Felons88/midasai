/**
 * Resend Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const resendProvider: CredentialProvider = {
  config: {
    id: 'resend',
    name: 'Resend',
    icon: '✉️',
    category: 'communication',
    documentationUrl: 'https://resend.com/docs/api-reference/introduction',
    rateLimitInfo: 'Rate limits: 100 requests per second for free tier',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 're_...',
        validation: /^re_[a-zA-Z0-9]{32}$/,
        validationMessage: 'Must start with re_ followed by 32 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^re_[a-zA-Z0-9]{32}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid Resend API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Resend',
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Resend',
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
