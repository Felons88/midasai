/**
 * Cloudflare Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const cloudflareProvider: CredentialProvider = {
  config: {
    id: 'cloudflare',
    name: 'Cloudflare',
    icon: '🌐',
    category: 'cloud',
    documentationUrl: 'https://developers.cloudflare.com/api/',
    rateLimitInfo: 'Rate limits: 1200 requests per 5 minutes for authenticated requests',
    fields: [
      createField('apiToken', 'API Token', {
        type: 'password',
        placeholder: '...',
        validation: /^[a-zA-Z0-9_\-\.]{40,}$/,
        validationMessage: 'Must be at least 40 characters'
      }),
      createField('accountId', 'Account ID', {
        type: 'text',
        placeholder: '...'
      }),
      createField('zoneId', 'Zone ID', {
        type: 'text',
        required: false,
        placeholder: '... (optional)'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiToken || fields.apiToken.trim() === '') {
      errors.apiToken = 'API Token is required'
    } else if (!/^[a-zA-Z0-9_\-\.]{40,}$/.test(fields.apiToken)) {
      errors.apiToken = 'Invalid Cloudflare API Token format'
    }

    if (!fields.accountId || fields.accountId.trim() === '') {
      errors.accountId = 'Account ID is required'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiToken } = fields
    
    try {
      const result = await testHttpRequest('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data?.result)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Cloudflare',
          metadata: {
            user: result.data?.result?.email,
            ...userInfo
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Cloudflare',
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
      apiToken: fields.apiToken?.trim() || '',
      accountId: fields.accountId?.trim() || '',
      zoneId: fields.zoneId?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { apiToken: value, accountId: '', zoneId: '' }
    }
  }
}
