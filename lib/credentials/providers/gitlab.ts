/**
 * GitLab Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const gitlabProvider: CredentialProvider = {
  config: {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    category: 'dev',
    documentationUrl: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
    rateLimitInfo: 'Rate limits: 2000 requests per minute for authenticated requests',
    fields: [
      createField('token', 'Personal Access Token', {
        type: 'password',
        placeholder: 'glpat-...',
        validation: /^glpat-[a-zA-Z0-9\-_]{20}$/,
        validationMessage: 'Must start with glpat- followed by 20 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.token || fields.token.trim() === '') {
      errors.token = 'Personal Access Token is required'
    } else if (!/^glpat-[a-zA-Z0-9\-_]{20}$/.test(fields.token)) {
      errors.token = 'Invalid GitLab Personal Access Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { token } = fields
    
    try {
      const result = await testHttpRequest('https://gitlab.com/api/v4/user', {
        headers: {
          'PRIVATE-TOKEN': token
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to GitLab',
          metadata: userInfo,
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to GitLab',
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
