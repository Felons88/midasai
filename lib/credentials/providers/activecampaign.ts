/**
 * ActiveCampaign Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const activecampaignProvider: CredentialProvider = {
  config: {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    icon: '🎯',
    category: 'communication',
    documentationUrl: 'https://developers.activecampaign.com/reference',
    rateLimitInfo: '5 requests per second',
    fields: [
      createField('apiKey', 'API Key', {
        type: 'password',
        placeholder: '...',
        required: true
      }),
      createField('apiUrl', 'API URL', {
        type: 'url',
        placeholder: 'https://youraccount.api-us1.com',
        required: true
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.apiKey || fields.apiKey.trim() === '') {
      errors.apiKey = 'API Key is required'
    }
    if (!fields.apiUrl || fields.apiUrl.trim() === '') {
      errors.apiUrl = 'API URL is required'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { apiKey, apiUrl } = fields
    
    try {
      const result = await testHttpRequest(`${apiUrl}/api/3/accounts`, {
        headers: {
          'Api-Token': apiKey
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to ActiveCampaign',
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to ActiveCampaign',
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
      apiKey: fields.apiKey?.trim() || '',
      apiUrl: fields.apiUrl?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { apiKey: value, apiUrl: '' }
    }
  }
}
