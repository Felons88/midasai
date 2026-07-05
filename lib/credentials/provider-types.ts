/**
 * Provider types and interfaces for credential management
 */

export type ProviderType = 
  | 'openai'
  | 'anthropic'
  | 'google-ai'
  | 'groq'
  | 'openrouter'
  | 'mistral'
  | 'cohere'
  | 'github'
  | 'gitlab'
  | 'slack'
  | 'discord'
  | 'stripe'
  | 'notion'
  | 'linear'
  | 'twilio'
  | 'sendgrid'
  | 'resend'
  | 'supabase'
  | 'vercel'
  | 'aws'
  | 'cloudflare'

export type ConnectionStatus = 
  | 'unknown'
  | 'connected'
  | 'failed'
  | 'expired'
  | 'invalid'
  | 'timeout'
  | 'network_error'

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'email' | 'number'
  required: boolean
  placeholder?: string
  validation?: RegExp
  validationMessage?: string
  sensitive?: boolean
}

export interface ConnectionTestResult {
  success: boolean
  status: ConnectionStatus
  message: string
  metadata?: {
    user?: string
    workspace?: string
    organization?: string
    project?: string
    account?: string
    [key: string]: any
  }
  error?: {
    code?: string
    type?: string
    details?: string
  }
  timestamp: string
}

export interface ProviderConfig {
  id: ProviderType
  name: string
  icon: string
  category: 'ai' | 'dev' | 'communication' | 'infrastructure' | 'cloud'
  fields: CredentialField[]
  documentationUrl?: string
  rateLimitInfo?: string
}

export interface CredentialData {
  provider: ProviderType
  name: string
  description?: string
  fields: Record<string, string>
  isDefault?: boolean
}

export interface StoredCredential {
  id: string
  user_id: string
  provider: ProviderType
  name: string
  description?: string
  masked: string
  encrypted_value: string
  fields: Record<string, string>
  is_default: boolean
  connection_status: ConnectionStatus
  last_tested_at: string | null
  last_successful_at: string | null
  connection_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CredentialProvider {
  config: ProviderConfig
  validate(fields: Record<string, string>): { valid: boolean; errors: Record<string, string> }
  test(fields: Record<string, string>): Promise<ConnectionTestResult>
  normalize(fields: Record<string, string>): Record<string, string>
  serialize(fields: Record<string, string>): string
  deserialize(value: string): Record<string, string>
}
