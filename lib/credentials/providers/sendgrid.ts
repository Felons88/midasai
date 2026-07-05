/**
 * SendGrid Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const sendgridProvider: CredentialProvider = {
  config: {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: '📧',
    category: 'communication',
    documentationUrl: 'https://docs.sendgrid.com/api-reference/api-keys',
    rateLimitInfo: 'Rate limits: 100 requests per second for free tier',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: 'SG....',
        validation: /^SG\.[a-zA-Z0-9\-_\.]{20,}$/,
        validationMessage: 'Must start with SG. followed by at least 20 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    } else if (!/^SG\.[a-zA-Z0-9\-_\.]{20,}$/.test(fields.apiKey)) {
      errors.apiKey = 'Invalid SendGrid API Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to SendGrid',
          metadata: {
            user: result.data?.username
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to SendGrid',
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
