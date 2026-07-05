/**
 * Supabase Provider
 */

import type { CredentialProvider } from '../provider-types'
import { createField } from '../provider-registry'
import { testHttpRequest, getStatusFromHttpStatus } from '../tester'

export const supabaseProvider: CredentialProvider = {
  config: {
    id: 'supabase',
    name: 'Supabase',
    icon: '🗄️',
    category: 'cloud',
    documentationUrl: 'https://supabase.com/docs/reference/javascript',
    rateLimitInfo: 'Rate limits: 50 requests per second for free tier',
    fields: [
      createField('projectUrl', 'Project URL', {
        type: 'url',
        placeholder: 'https://xxx.supabase.co',
        validation: /^https:\/\/[a-zA-Z0-9\-]+\.supabase\.co$/,
        validationMessage: 'Must be a valid Supabase project URL'
      }),
      createField('anonKey', 'Anon Key', {
        type: 'password',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        validation: /^eyJ[a-zA-Z0-9\-_\.]{100,}$/,
        validationMessage: 'Must be a valid JWT'
      }),
      createField('serviceRoleKey', 'Service Role Key', {
        type: 'password',
        required: false,
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (optional)',
        validation: /^eyJ[a-zA-Z0-9\-_\.]{100,}$/,
        validationMessage: 'Must be a valid JWT'
      })
    ]
  },

  validate(fields) {
    const errors: Record<string, string> = {}
    
    if (!fields.projectUrl || fields.projectUrl.trim() === '') {
      errors.projectUrl = 'Project URL is required'
    } else if (!/^https:\/\/[a-zA-Z0-9\-]+\.supabase\.co$/.test(fields.projectUrl)) {
      errors.projectUrl = 'Invalid Supabase project URL format'
    }

    if (!fields.anonKey || fields.anonKey.trim() === '') {
      errors.anonKey = 'Anon Key is required'
    } else if (!/^eyJ[a-zA-Z0-9\-_\.]{100,}$/.test(fields.anonKey)) {
      errors.anonKey = 'Invalid Anon Key format'
    }

    if (fields.serviceRoleKey && !/^eyJ[a-zA-Z0-9\-_\.]{100,}$/.test(fields.serviceRoleKey)) {
      errors.serviceRoleKey = 'Invalid Service Role Key format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  },

  async test(fields) {
    const { projectUrl, anonKey } = fields
    
    try {
      const result = await testHttpRequest(`${projectUrl}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      })

      if (result.success) {
        return {
          success: true,
          status: 'connected',
          message: 'Successfully connected to Supabase',
          metadata: {
            project: projectUrl
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        status: getStatusFromHttpStatus(result.status),
        message: result.error || 'Failed to connect to Supabase',
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
      projectUrl: fields.projectUrl?.trim() || '',
      anonKey: fields.anonKey?.trim() || '',
      serviceRoleKey: fields.serviceRoleKey?.trim() || ''
    }
  },

  serialize(fields) {
    return JSON.stringify(this.normalize(fields))
  },

  deserialize(value) {
    try {
      return JSON.parse(value)
    } catch {
      return { projectUrl: '', anonKey: value, serviceRoleKey: '' }
    }
  }
}
