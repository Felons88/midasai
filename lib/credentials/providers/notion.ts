/**
 * Notion Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const notionProvider: CredentialProvider = {
  config: {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    category: 'infrastructure',
    documentationUrl: 'https://developers.notion.com/docs/authorization',
    rateLimitInfo: 'Rate limits: 3 requests per second for integration tokens',
    fields: [
      createField('token', 'Integration Token', {
        type: 'password',
        placeholder: 'secret_...',
        validation: /^secret_[a-zA-Z0-9]{32}$/,
        validationMessage: 'Must start with secret_ followed by 32 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.token || fields.token.trim() === '') {
      errors.token = 'Integration Token is required'
    } else if (!/^secret_[a-zA-Z0-9]{32}$/.test(fields.token)) {
      errors.token = 'Invalid Notion Integration Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { token } = fields
    
    try {
      const result = await testHttpRequest('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28'
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Notion',
          metadata: {
            user: result.data.name,
            ...userInfo
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Notion',
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
      token: fields.token?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { token: value }
    }
  }
}
