/**
 * CredentialService - Orchestrates all credential operations
 * 
 * This service provides a high-level API for credential management,
 * integrating encryption, validation, testing, and database operations.
 */

import type { 
  ProviderType, 
  CredentialData, 
  StoredCredential, 
  ConnectionTestResult 
} from './provider-types'
import { providerRegistry } from './provider-registry'
import { validateCredentialFields } from './validator'
import { testCredential } from './tester'
import { encrypt, decrypt, maskValue, isValidEncrypted } from './encryption'
import { createClient } from '@/lib/supabase/server'

export interface CreateCredentialResult {
  success: boolean
  credential?: StoredCredential
  error?: string
}

export interface UpdateCredentialResult {
  success: boolean
  credential?: StoredCredential
  error?: string
}

export interface TestCredentialResult {
  success: boolean
  result?: ConnectionTestResult
  error?: string
}

export class CredentialService {
  /**
   * Create a new credential
   */
  async create(userId: string, data: CredentialData): Promise<CreateCredentialResult> {
    const provider = providerRegistry.get(data.provider)
    if (!provider) {
      return { success: false, error: `Unknown provider: ${data.provider}` }
    }

    // Validate fields
    const validation = provider.validate(data.fields)
    if (!validation.valid) {
      return { 
        success: false, 
        error: Object.values(validation.errors).join(', ') 
      }
    }

    // Normalize fields
    const normalizedFields = provider.normalize(data.fields)

    // Serialize and encrypt
    const serialized = provider.serialize(normalizedFields)
    const encrypted = encrypt(serialized)

    // Generate masked value for display
    const primaryField = provider.config.fields[0].key
    const masked = maskValue(normalizedFields[primaryField] || '')

    // If setting as default, clear existing default for this provider
    if (data.isDefault) {
      await this.clearDefaultForProvider(userId, data.provider)
    }

    // Insert into database
    const supabase = await createClient()
    const { data: credential, error } = await supabase
      .from('nexus_credentials')
      .insert({
        user_id: userId,
        provider: data.provider,
        name: data.name,
        description: data.description || null,
        masked,
        encrypted_value: encrypted,
        fields: normalizedFields,
        is_default: data.isDefault || false,
        connection_status: 'unknown',
        last_tested_at: null,
        last_successful_at: null,
        connection_metadata: {}
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, credential }
  }

  /**
   * Update an existing credential
   */
  async update(
    userId: string, 
    credentialId: string, 
    data: Partial<CredentialData>
  ): Promise<UpdateCredentialResult> {
    const supabase = await createClient()

    // Fetch existing credential
    const { data: existing, error: fetchError } = await supabase
      .from('nexus_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Credential not found' }
    }

    const provider = providerRegistry.get(existing.provider)
    if (!provider) {
      return { success: false, error: `Unknown provider: ${existing.provider}` }
    }

    // Prepare updates
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Update name/description if provided
    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description

    // Update fields if provided
    if (data.fields) {
      const validation = provider.validate(data.fields)
      if (!validation.valid) {
        return { 
          success: false, 
          error: Object.values(validation.errors).join(', ') 
        }
      }

      const normalizedFields = provider.normalize(data.fields)
      const serialized = provider.serialize(normalizedFields)
      const encrypted = encrypt(serialized)

      const primaryField = provider.config.fields[0].key
      updates.masked = maskValue(normalizedFields[primaryField] || '')
      updates.encrypted_value = encrypted
      updates.fields = normalizedFields
      updates.connection_status = 'unknown'
    }

    // Update default status if provided
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        await this.clearDefaultForProvider(userId, existing.provider)
      }
      updates.is_default = data.isDefault
    }

    // Apply updates
    const { data: credential, error: updateError } = await supabase
      .from('nexus_credentials')
      .update(updates)
      .eq('id', credentialId)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, credential }
  }

  /**
   * Delete a credential
   */
  async delete(userId: string, credentialId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('nexus_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * List all credentials for a user
   */
  async list(userId: string): Promise<StoredCredential[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('nexus_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return []
    }

    return data || []
  }

  /**
   * Get a specific credential
   */
  async get(userId: string, credentialId: string): Promise<StoredCredential | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('nexus_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  /**
   * Get default credential for a provider
   */
  async getDefault(userId: string, provider: ProviderType): Promise<StoredCredential | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('nexus_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_default', true)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  /**
   * Set a credential as default for its provider
   */
  async setDefault(userId: string, credentialId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Fetch credential to get provider
    const { data: credential, error: fetchError } = await supabase
      .from('nexus_credentials')
      .select('provider')
      .eq('id', credentialId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !credential) {
      return { success: false, error: 'Credential not found' }
    }

    // Clear existing default for this provider
    await this.clearDefaultForProvider(userId, credential.provider)

    // Set new default
    const { error: updateError } = await supabase
      .from('nexus_credentials')
      .update({ is_default: true })
      .eq('id', credentialId)
      .eq('user_id', userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  }

  /**
   * Clear default credential for a provider
   */
  private async clearDefaultForProvider(userId: string, provider: ProviderType): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('nexus_credentials')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_default', true)
  }

  /**
   * Test a credential connection
   */
  async test(userId: string, credentialId: string): Promise<TestCredentialResult> {
    const credential = await this.get(userId, credentialId)
    if (!credential) {
      return { success: false, error: 'Credential not found' }
    }

    const provider = providerRegistry.get(credential.provider)
    if (!provider) {
      return { success: false, error: `Unknown provider: ${credential.provider}` }
    }

    // Decrypt and deserialize fields
    const decrypted = decrypt(credential.encrypted_value)
    const fields = provider.deserialize(decrypted)

    // Test connection
    const result = await testCredential(credential.provider, fields)

    // Update credential with test results
    const supabase = await createClient()
    await supabase
      .from('nexus_credentials')
      .update({
        connection_status: result.status,
        last_tested_at: result.timestamp,
        last_successful_at: result.success ? result.timestamp : credential.last_successful_at,
        connection_metadata: result.metadata || {}
      })
      .eq('id', credentialId)
      .eq('user_id', userId)

    return { success: true, result }
  }

  /**
   * Get decrypted credential fields (for internal use only)
   */
  async getDecryptedFields(userId: string, credentialId: string): Promise<Record<string, string> | null> {
    const credential = await this.get(userId, credentialId)
    if (!credential) {
      return null
    }

    const provider = providerRegistry.get(credential.provider)
    if (!provider) {
      return null
    }

    const decrypted = decrypt(credential.encrypted_value)
    return provider.deserialize(decrypted)
  }

  /**
   * Duplicate a credential
   */
  async duplicate(userId: string, credentialId: string, newName: string): Promise<CreateCredentialResult> {
    const credential = await this.get(userId, credentialId)
    if (!credential) {
      return { success: false, error: 'Credential not found' }
    }

    const provider = providerRegistry.get(credential.provider)
    if (!provider) {
      return { success: false, error: `Unknown provider: ${credential.provider}` }
    }

    // Decrypt and get fields
    const decrypted = decrypt(credential.encrypted_value)
    const fields = provider.deserialize(decrypted)

    // Create new credential with same fields
    return this.create(userId, {
      provider: credential.provider,
      name: newName,
      description: credential.description,
      fields,
      isDefault: false
    })
  }
}

// Export singleton instance
export const credentialService = new CredentialService()
