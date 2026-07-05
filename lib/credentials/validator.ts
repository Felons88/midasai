/**
 * CredentialValidator - Validates credential field formats
 */

import type { CredentialField, ProviderType } from './provider-types'
import { providerRegistry } from './provider-registry'

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validate credential fields based on provider configuration
 */
export function validateCredentialFields(
  provider: ProviderType,
  fields: Record<string, string>
): ValidationResult {
  const providerConfig = providerRegistry.getConfig(provider)
  if (!providerConfig) {
    return {
      valid: false,
      errors: { provider: `Unknown provider: ${provider}` }
    }
  }

  const errors: Record<string, string> = {}

  for (const field of providerConfig.fields) {
    const value = fields[field.key]

    // Check required fields
    if (field.required && (!value || value.trim() === '')) {
      errors[field.key] = `${field.label} is required`
      continue
    }

    // Skip validation if field is empty and not required
    if (!value || value.trim() === '') {
      continue
    }

    // Apply custom validation regex
    if (field.validation && !field.validation.test(value)) {
      errors[field.key] = field.validationMessage || `Invalid ${field.label} format`
      continue
    }

    // Type-specific validations
    if (field.type === 'email' && !isValidEmail(value)) {
      errors[field.key] = 'Invalid email address'
    }

    if (field.type === 'url' && !isValidUrl(value)) {
      errors[field.key] = 'Invalid URL format'
    }

    if (field.type === 'number' && !isValidNumber(value)) {
      errors[field.key] = 'Must be a valid number'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate number format
 */
function isValidNumber(value: string): boolean {
  return !isNaN(Number(value))
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // API Keys (alphanumeric, 20-128 chars)
  apiKey: /^[a-zA-Z0-9_\-\.]{20,128}$/,
  
  // OpenAI API Key (sk- followed by alphanumeric)
  openaiApiKey: /^sk-[a-zA-Z0-9]{20,}$/,
  
  // Anthropic API Key (sk-ant- followed by alphanumeric)
  anthropicApiKey: /^sk-ant-[a-zA-Z0-9\-_]{20,}$/,
  
  // GitHub Personal Access Token (ghp_ or gho_ followed by alphanumeric)
  githubToken: /^gh[pou]_[a-zA-Z0-9]{36}$/,
  
  // GitLab Personal Access Token (glpat- followed by alphanumeric)
  gitlabToken: /^glpat-[a-zA-Z0-9\-_]{20}$/,
  
  // Slack Bot Token (xoxb- followed by alphanumeric)
  slackBotToken: /^xoxb-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24}$/,
  
  // Discord Bot Token (alphanumeric with dots)
  discordBotToken: /^[a-zA-Z0-9_\-\.]{59,}$/,
  
  // Stripe Secret Key (sk_live_ or sk_test_ followed by alphanumeric)
  stripeSecretKey: /^sk_(live|test)_[a-zA-Z0-9]{24,}$/,
  
  // Stripe Publishable Key (pk_live_ or pk_test_ followed by alphanumeric)
  stripePublishableKey: /^pk_(live|test)_[a-zA-Z0-9]{24,}$/,
  
  // Notion Integration Token (secret_ followed by alphanumeric)
  notionToken: /^secret_[a-zA-Z0-9]{32}$/,
  
  // Linear API Key (lin_api_ followed by alphanumeric)
  linearApiKey: /^lin_api_[a-zA-Z0-9]{32}$/,
  
  // Twilio Account SID (AC followed by alphanumeric)
  twilioAccountSid: /^AC[a-zA-Z0-9]{32}$/,
  
  // SendGrid API Key (SG. followed by base64-like)
  sendGridApiKey: /^SG\.[a-zA-Z0-9\-_\.]{20,}$/,
  
  // Resend API Key (re_ followed by alphanumeric)
  resendApiKey: /^re_[a-zA-Z0-9]{32}$/,
  
  // Supabase Project URL (https:// followed by alphanumeric with .supabase.co)
  supabaseUrl: /^https:\/\/[a-zA-Z0-9\-]+\.supabase\.co$/,
  
  // Vercel Access Token (vpa_ followed by alphanumeric)
  vercelToken: /^vpa_[a-zA-Z0-9]{32}$/,
  
  // AWS Access Key ID (20 alphanumeric characters)
  awsAccessKeyId: /^[A-Z0-9]{20}$/,
  
  // Cloudflare API Token (alphanumeric with dots and dashes)
  cloudflareToken: /^[a-zA-Z0-9_\-\.]{40,}$/
}
