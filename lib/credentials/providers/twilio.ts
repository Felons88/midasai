/**
 * Twilio Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const twilioProvider: CredentialProvider = {
  config: {
    id: 'twilio',
    name: 'Twilio',
    icon: '📞',
    category: 'communication',
    documentationUrl: 'https://www.twilio.com/docs/usage/api',
    rateLimitInfo: 'Rate limits: 1 request per second for account SID validation',
    fields: [
      createField('accountSid', 'Account SID', {
        type: 'text',
        placeholder: 'AC...',
        validation: /^AC[a-zA-Z0-9]{32}$/,
        validationMessage: 'Must start with AC followed by 32 characters'
      }),
      createField('authToken', 'Auth Token', {
        type: 'password',
        placeholder: '...',
        validation: /^[a-zA-Z0-9]{32}$/,
        validationMessage: 'Must be 32 characters'
      }),
      createField('phoneNumber', 'Phone Number', {
        type: 'text',
        required: false,
        placeholder: '+1... (optional)'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.accountSid || fields.accountSid.trim() === '') {
      errors.accountSid = 'Account SID is required'
    } else if (!/^AC[a-zA-Z0-9]{32}$/.test(fields.accountSid)) {
      errors.accountSid = 'Invalid Twilio Account SID format'
    }

    if (!fields.authToken || fields.authToken.trim() === '') {
      errors.authToken = 'Auth Token is required'
    } else if (!/^[a-zA-Z0-9]{32}$/.test(fields.authToken)) {
      errors.authToken = 'Invalid Twilio Auth Token format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { accountSid, authToken } = fields
    
    try {
      const result = await testHttpRequest(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
          }
        }
      )

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Twilio',
          metadata: {
            account: result.data?.friendly_name
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Twilio',
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
      accountSid: fields.accountSid?.trim() || '',
      authToken: fields.authToken?.trim() || '',
      phoneNumber: fields.phoneNumber?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { accountSid: '', authToken: value, phoneNumber: '' }
    }
  }
}
