/**
 * ProviderRegistry - Registry for all credential providers
 * 
 * This module maintains a registry of all supported credential providers
 * and provides methods to register, retrieve, and list providers.
 */

import type { 
  ProviderType, 
  ProviderConfig, 
  CredentialProvider,
  CredentialField 
} from './provider-types'

class ProviderRegistry {
  private providers: Map<ProviderType, CredentialProvider> = new Map()

  /**
   * Register a credential provider
   */
  register(provider: CredentialProvider): void {
    this.providers.set(provider.config.id, provider)
  }

  /**
   * Get a specific provider by ID
   */
  get(id: ProviderType): CredentialProvider | undefined {
    return this.providers.get(id)
  }

  /**
   * Get all registered providers
   */
  getAll(): CredentialProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get providers by category
   */
  getByCategory(category: string): CredentialProvider[] {
    return this.getAll().filter(p => p.config.category === category)
  }

  /**
   * Check if a provider is registered
   */
  has(id: ProviderType): boolean {
    return this.providers.has(id)
  }

  /**
   * Get provider config without the implementation
   */
  getConfig(id: ProviderType): ProviderConfig | undefined {
    return this.providers.get(id)?.config
  }

  /**
   * Get all provider configs
   */
  getAllConfigs(): ProviderConfig[] {
    return this.getAll().map(p => p.config)
  }
}

// Export singleton instance
export const providerRegistry = new ProviderRegistry()

/**
 * Helper function to create credential field definitions
 */
export function createField(
  key: string,
  label: string,
  options: Partial<CredentialField> = {}
): CredentialField {
  return {
    key,
    label,
    type: 'text',
    required: true,
    sensitive: true,
    ...options
  }
}
