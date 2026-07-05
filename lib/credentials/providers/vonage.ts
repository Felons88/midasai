/**
 * Vonage Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const vonageProvider: CredentialProvider = {
  config: {
    id: 'vonage',
    name: 'Vonage',
    icon: '📞',
    category: 'communication',
    documentationUrl: 'https://developer.vonage.com/api/sms',
    rateLimitInfo: '30 requests per second',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'text',
        placeholder: '...',
        required: true
      }),
      createField('apiSecret', 'API Secret', {
        type: 'password',
        placeholder: '...',
        required: true
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    }
    if (!fields.apiSecret || fields.apiSecret.trim() === '') {
      errors.apiSecret = 'API Secret is required'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey, apiSecret } = fields
    
    try {
      const result = await testHttpRequest(`https://rest.nexmo.com/account`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Vonage',
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Vonage',
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
      apiKey: fields.apiKey?.trim() || '',
      apiSecret: fields.apiSecret?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { apiKey: value, apiSecret: '' }
    }
  }
}
