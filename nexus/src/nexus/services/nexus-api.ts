// src/nexus/services/nexus-api.ts
import { NexusInterface } from '../interfaces/INexus';
import { Result } from '../utils/Result';

export interface NexusAPIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface NexusAPIResponse<T> {
  status: number;
  data: T | null;
  error?: string;
}

export interface DirectoryMetadata {
  id: string;
  path: string;
  type: 'skill' | 'model' | 'workflow' | 'agent';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export class NexusAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/nexus') {
    this.baseUrl = baseUrl;
  }

  async request<T>(req: NexusAPIRequest): Promise<NexusAPIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${req.endpoint}`, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers
        },
        body: req.body ? JSON.stringify(req.body) : undefined
      });

      const data = await response.json() as T;
      return { status: response.status, data, error: response.ok ? undefined : 'API error' };
    } catch (error) {
      return { status: 500, data: null, error: String(error) };
    }
  }

  async listDirectories(): Promise<NexusAPIResponse<DirectoryMetadata[]>> {
    return this.request<DirectoryMetadata[]>({
      method: 'GET',
      endpoint: '/directories'
    });
  }

  async optimizeDirectory(): Promise<NexusAPIResponse<void>> {
    return this.request<void>({
      method: 'POST',
      endpoint: '/optimize'
    });
  }

  async classifyFiles(files: string[]): Promise<NexusAPIResponse<Record<string, string>>> {
    return this.request<Record<string, string>>({
      method: 'POST',
      endpoint: '/classify',
      body: { files }
    });
  }
}

export const nexusAPI = new NexusAPI();