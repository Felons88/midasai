/**
 * Stripe Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus, extractUserInfo } from '../tester'

export const stripeProvider: CredentialProvider = {
  config: {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    category: 'infrastructure',
    documentationUrl: 'https://stripe.com/docs/api/authentication',
    rateLimitInfo: 'Rate limits: 25 requests per second for standard accounts',
    fields: [
      createField('secretKey', 'Secret Key', {
        type: 'password',
        placeholder: 'sk_live_... or sk_test_...',
        validation: /^sk_(live|test)_[a-zA-Z0-9]{24,}$/,
        validationMessage: 'Must start with sk_live_ or sk_test_ followed by at least 24 characters'
      }),
      createField('publishableKey', 'Publishable Key', {
        type: 'password',
        required: false,
        placeholder: 'pk_live_... or pk_test_... (optional)',
        validation: /^pk_(live|test)_[a-zA-Z0-9]{24,}$/,
        validationMessage: 'Must start with pk_live_ or pk_test_'
      }),
      createField('webhookSecret', 'Webhook Secret', {
        type: 'password',
        required: false,
        placeholder: 'whsec_... (optional)',
        validation: /^whsec_[a-zA-Z0-9]{32,}$/,
        validationMessage: 'Must start with whsec_'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.secretKey || fields.secretKey.trim() === '') {
      errors.secretKey = 'Secret Key is required'
    } else if (!/^sk_(live|test)_[a-zA-Z0-9]{24,}$/.test(fields.secretKey)) {
      errors.secretKey = 'Invalid Stripe Secret Key format'
    }

    if (fields.publishableKey && !/^pk_(live|test)_[a-zA-Z0-9]{24,}$/.test(fields.publishableKey)) {
      errors.publishableKey = 'Invalid Stripe Publishable Key format'
    }

    if (fields.webhookSecret && !/^whsec_[a-zA-Z0-9]{32,}$/.test(fields.webhookSecret)) {
      errors.webhookSecret = 'Invalid Stripe Webhook Secret format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { secretKey } = fields
    
    try {
      const result = await testHttpRequest('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      })

      if (result.success) {
        const userInfo = extractUserInfo(result.data)
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Stripe',
          metadata: {
            account: result.data.id,
            ...userInfo
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Stripe',
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
      secretKey: fields.secretKey?.trim() || '',
      publishableKey: fields.publishableKey?.trim() || '',
      webhookSecret: fields.webhookSecret?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { secretKey: value, publishableKey: '', webhookSecret: '' }
    }
  }
}
