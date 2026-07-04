// src/nexus/interfaces/ISupplier.ts
export interface Supplier {
  id: string;
  name: string;
  type: 'cloud' | 'on-prem' | 'hybrid';
  region: string;
  status: 'active' | 'inactive';
  apiKeys: string[];
  features: string[];
  metadata: Record<string, unknown>;
}

export interface SupplierQueryParams {
  type: 'cloud' | 'on-prem' | 'hybrid';
  region?: string;
  status?: 'active' | 'inactive';
  features?: string[];
}