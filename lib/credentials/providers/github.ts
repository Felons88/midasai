/**
 * GitHub Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const githubProvider: CredentialProvider = {
  config: {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    category: 'dev',
    documentationUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
    rateLimitInfo: 'Rate limits: 5000 requests/hour for authenticated requests',
    fields: [
      createField('token', 'Personal Access Token', {
        type: 'password',
        placeholder: 'ghp_...',
        validation: /^gh[pou]_[a-zA-Z0-9]{36}$/,
        validationMessage: 'Must start with ghp_, gho_, ghu_, or ghs_ followed by 36 characters'
      }),
      createField('username', 'Username', {
        type: 'text',
        required: false,
        placeholder: 'Optional: your GitHub username'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.token || fields.token.trim() === '') {
      errors.token = 'Personal Access Token is required'
    } else if (!/^gh[pou]_[a-zA-Z0-9]{36}$/.test(fields.token)) {
      errors.token = 'Invalid GitHub Personal Access Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { token } = fields
    
    try {
      const result = await testHttpRequest('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to GitHub',
          metadata: userInfo,
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to GitHub',
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
      token: fields.token?.trim() || '',
      username: fields.username?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { token: value, username: '' }
    }
  }
}
