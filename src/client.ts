import { Endpoint } from './endpoints.ts';
import { BaackApiError } from './errors.ts';

export interface BaackConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  /**
   * Whether the browser sends cookies with each request. Use 'include' for a
   * browser client that relies on the user's Baack session from another
   * origin. Defaults to the fetch default ('same-origin').
   */
  credentials?: 'omit' | 'same-origin' | 'include';
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class BaackClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private credentials: BaackConfig['credentials'];

  constructor(config: BaackConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = { ...config.headers };
    this.credentials = config.credentials;
  }

  /**
   * Core request handler.
   * Supports both Browser and Node environments via global fetch.
   *
   * Throws BaackApiError for any non-2xx response. Resolves to undefined for
   * an empty response body (for example a 204 from a delete).
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
    params?: QueryParams
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.append(k, String(v));
        }
      });
    }

    // Only declare a JSON body when there is one: a Content-Type header on a
    // bodiless cross-origin GET forces a CORS preflight.
    const headers: Record<string, string> = typeof options.body === 'string'
      ? { 'Content-Type': 'application/json', ...this.defaultHeaders }
      : { ...this.defaultHeaders };

    const init: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    };
    if (this.credentials) {
      init.credentials = this.credentials;
    }

    const method = options.method ?? 'GET';
    const response = await fetch(url.toString(), init);
    const text = await response.text();

    if (!response.ok) {
      throw new BaackApiError(response.status, response.statusText, text, method, url.toString());
    }

    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * CREATE / POST method for creating resources
   */
  public async create<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, jsonInit('POST', body));
  }

  /**
   * READ / GET method for all endpoints. `headers` are added to this request
   * only: a server reading the entity view for a visitor can forward their
   * `Accept-Language`, so the view picks the best available language.
   */
  public async read<T>(endpoint: string, urn: string, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint + urn, { method: 'GET', ...(headers ? { headers } : {}) }, params);
  }

  /**
   * UPDATE / PUT for updating representations
   */
  public async update<T>(endpoint: string, urn: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint + urn, jsonInit('PUT', body));
  }

  /**
   * DELETE for deleting representations
   */
  public async delete<T = undefined>(endpoint: string, urn: string): Promise<T> {
    return this.request<T>(endpoint + urn, {
      method: 'DELETE',
    });
  }

  /**
   * POST a multipart form, for example an image file upload. The browser sets
   * the multipart Content-Type and boundary itself.
   */
  public async upload<T>(endpoint: string, form: FormData): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: form });
  }

  /**
   * Specialized Search method supporting partial results and includeScopes
   */
  public async search<Search>(params: Search): Promise<Search> {
    return this.create<Search>(Endpoint.SEARCH, params);
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return body === undefined ? { method } : { method, body: JSON.stringify(body) };
}
