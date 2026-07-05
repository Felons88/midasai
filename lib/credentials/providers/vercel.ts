/**
 * Vercel Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const vercelProvider: CredentialProvider = {
  config: {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    category: 'cloud',
    documentationUrl: 'https://vercel.com/docs/rest-api',
    rateLimitInfo: 'Rate limits: 1000 requests per hour for authenticated requests',
    fields: [
      createField('accessToken', 'Access Token', {
        type: 'password',
        placeholder: 'vpa_...',
        validation: /^vpa_[a-zA-Z0-9]{32}$/,
        validationMessage: 'Must start with vpa_ followed by 32 characters'
      }),
      createField('teamId', 'Team ID', {
        type: 'text',
        required: false,
        placeholder: 'team_... (optional for personal account)'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.accessToken || fields.accessToken.trim() === '') {
      errors.accessToken = 'Access Token is required'
    } else if (!/^vpa_[a-zA-Z0-9]{32}$/.test(fields.accessToken)) {
      errors.accessToken = 'Invalid Vercel Access Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { accessToken } = fields
    
    try {
      const result = await testHttpRequest('https://api.vercel.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Vercel',
          metadata: {
            user: result.data?.user?.username,
            ...userInfo
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Vercel',
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
      accessToken: fields.accessToken?.trim() || '',
      teamId: fields.teamId?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { accessToken: value, teamId: '' }
    }
  }
}
