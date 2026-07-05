/**
 * Acuity Scheduling Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const acuityProvider: CredentialProvider = {
  config: {
    id: 'acuity',
    name: 'Acuity Scheduling',
    icon: '📅',
    category: 'communication',
    documentationUrl: 'https://developers.acuityscheduling.com/docs/v1',
    rateLimitInfo: '100 requests per minute',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: '...',
        required: true
      }),
      createField('userId', 'User ID', {
        type: 'text',
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
    if (!fields.userId || fields.userId.trim() === '') {
      errors.userId = 'User ID is required'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey, userId } = fields
    
    try {
      const result = await testHttpRequest(`https://acuityscheduling.com/api/v1/appointments?limit=1`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Acuity Scheduling',
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Acuity Scheduling',
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
      userId: fields.userId?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { apiKey: value, userId: '' }
    }
  }
}
