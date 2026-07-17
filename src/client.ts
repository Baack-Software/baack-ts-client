import { Endpoint, ApiMode } from './endpoints';
import { SearchParams } from './types';

export interface BaackConfig {
  baseUrl: string;
  mode?: ApiMode;
  headers?: Record<string, string>;
}

export class BaackClient {
  private baseUrl: string;
  private mode: ApiMode;
  private defaultHeaders: Record<string, string>;

  constructor(config: BaackConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.mode = config.mode || 'native';
    this					= {
      'Content-Type': 'application/json',
      ...config.headers,
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
   * GET method for all endpoints
   */
  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(this.baseUrl + endpoint);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }
    return this.request<T>(url.toString(), { method: 'GET' });
  }

  /**
   * POST method for creating resources
   */
  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    // Note: In a real implementation, we'd use the endpoint path logic 
    // to determine if we are hitting /n/ or /v/ based on this.mode
  }

  /**
   * Specialized Search method supporting partial results and includeScopes
   */
  public async search<T>(params: SearchParams): Promise<T> {
    const query = new URLSearchParams();
    if (params.includeScopes) {
      params.includeScopes.forEach(s => query.append('includeScopes', s));
    }
    if (params.order) {
      query.append('order', params.order);
    }
    return this.get(`${Endpoint.SEARCH}${query.toString()}`);
  }

  /**
   * Dynamic endpoint resolver to switch between Native (/n/) and View (/v/) modes
   */
  public getUrlFor(endpoint: keyof typeof Endpoint, urn?: string): string {
    const path = Endpoint[endpoint];
    const resolvedPath = urn ? `${path}${urn}` : path;
    
    // If mode is 'view', we rewrite the path from /n/ to /v/ 
    // (Example: /n/v1/entity/ -> /v/v1/entityview/)
    // Note: This logic depends on how your server maps view endpoints.
    if (this.mode === 'view' && resolvedPath.startsWith('/n/')) {
        return resolvedPath.replace('/n/', '/v/');
    }

    return this.baseUrl + resolvedPath;
  }
}

