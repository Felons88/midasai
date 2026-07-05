/**
 * Discord Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const discordProvider: CredentialProvider = {
  config: {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    category: 'communication',
    documentationUrl: 'https://discord.com/developers/docs/intro',
    rateLimitInfo: 'Rate limits: 50 requests per second for bot requests',
    fields: [
      createField('botToken', 'Bot Token', {
        type: 'password',
        placeholder: '...',
        validation: /^[a-zA-Z0-9_\-\.]{59,}$/,
        validationMessage: 'Must be at least 59 characters'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.botToken || fields.botToken.trim() === '') {
      errors.botToken = 'Bot Token is required'
    } else if (!/^[a-zA-Z0-9_\-\.]{59,}$/.test(fields.botToken)) {
      errors.botToken = 'Invalid Discord Bot Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { botToken } = fields
    
    try {
      const result = await testHttpRequest('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bot ${botToken}`
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Discord',
          metadata: {
            user: result.data.username,
            ...userInfo
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Discord',
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
      botToken: fields.botToken?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { botToken: value }
    }
  }
}
