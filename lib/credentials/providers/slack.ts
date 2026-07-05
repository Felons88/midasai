/**
 * Slack Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const slackProvider: CredentialProvider = {
  config: {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    category: 'communication',
    documentationUrl: 'https://api.slack.com/authentication/token-types',
    rateLimitInfo: 'Rate limits vary by tier. Check your app dashboard.',
    fields: [
      createField('botToken', 'Bot Token', {
        type: 'password',
        placeholder: 'xoxb-...',
        validation: /^xoxb-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24}$/,
        validationMessage: 'Must start with xoxb- followed by workspace ID, bot ID, and token'
      }),
      createField('appToken', 'App Token', {
        type: 'password',
        required: false,
        placeholder: 'xapp-... (optional)',
        validation: /^xapp-[A-Za-z0-9\-_]{12,}$/,
        validationMessage: 'Must start with xapp-'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.botToken || fields.botToken.trim() === '') {
      errors.botToken = 'Bot Token is required'
    } else if (!/^xoxb-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24}$/.test(fields.botToken)) {
      errors.botToken = 'Invalid Slack Bot Token format'
    }

    if (fields.appToken && !/^xapp-[A-Za-z0-9\-_]{12,}$/.test(fields.appToken)) {
      errors.appToken = 'Invalid Slack App Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { botToken } = fields
    
    try {
      const result = await testHttpRequest('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST'
      })

      if (result.success && result.data?.ok) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Slack',
          metadata: {
            user: result.data.user,
            team: result.data.team,
            workspace: result.data.team
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.data?.error || result.error || 'Failed to connect to Slack',
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
      botToken: fields.botToken?.trim() || '',
      appToken: fields.appToken?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { botToken: value, appToken: '' }
    }
  }
}
