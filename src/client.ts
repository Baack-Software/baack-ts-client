import { Endpoint } from './endpoints.ts';
import type { } from './types/index.ts';

export interface BaackConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export class BaackClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: BaackConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Core request handler. 
   * Supports both Browser and Node environments via global fetch.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(this.baseUrl + endpoint);
    
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Baack API Error [${response.status}]: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * CREATE / POST method for creating resources
   */
  public async create<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : '',
    });
  }

  /**
   * READ / GET method for all endpoints
   */
  public async read<T>(endpoint: string, urn: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(this.baseUrl + endpoint + urn);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }
    return this.request<T>(url.toString(), { method: 'GET' });
  }

  /**
   * UPDATE / PUT for updating representations
   */
   public async update<T>(endpoint: string, urn: string, body?: unknown): Promise<T> {
     const url = new URL(this.baseUrl + endpoint + urn);
     return this.request<T>(url.toString(), {
       method: 'PUT',
       body: body ? JSON.stringify(body) : '',
     });
   }

  /**
   * DELETE for deleting representations
   */
  public async delete<T>(endpoint: string, urn: string): Promise<T> {
    const url = new URL(this.baseUrl + endpoint + urn);
    return this.request<T>(url.toString(), {
      method: 'DELETE',
    });
  }

  /**
   * Specialized Search method supporting partial results and includeScopes
   */
  public async search<Search>(params: Search): Promise<Search> {
    return this.create<Search>(Endpoint.SEARCH, params);
  }
}

