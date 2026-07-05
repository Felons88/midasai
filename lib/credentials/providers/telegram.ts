/**
 * Telegram Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const telegramProvider: CredentialProvider = {
  config: {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    category: 'communication',
    documentationUrl: 'https://core.telegram.org/bots/api',
    rateLimitInfo: '30 messages per second to different chats',
    fields: [
      createField('botToken', 'Bot Token', {
        type: 'password',
        placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        validation: /^\d+:[A-Za-z0-9_-]{35}$/,
        validationMessage: 'Must be a valid Telegram bot token'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.botToken || fields.botToken.trim() === '') {
      errors.botToken = 'Bot Token is required'
    } else if (!/^\d+:[A-Za-z0-9_-]{35}$/.test(fields.botToken)) {
      errors.botToken = 'Invalid Telegram bot token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { botToken } = fields
    
    try {
      const result = await testHttpRequest(`https://api.telegram.org/bot${botToken}/getMe`)

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Telegram',
          metadata: {
            bot: result.data?.result?.username || undefined,
            id: result.data?.result?.id || undefined
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Telegram',
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
