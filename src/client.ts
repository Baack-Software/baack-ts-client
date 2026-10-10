import { Endpoint } from './endpoints.ts';
import { BaackApiError } from './errors.ts';
import type { Search } from './types/index.ts';

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

/**
 * The HTTP method behind each of the API's operations, named as the API docs
 * and this client's methods name them: `Method.UPDATE` is `PUT`. Use these
 * rather than HTTP method strings, for example in tests or a proxy allowlist.
 */
export const Method = {
  CREATE: 'POST',
  READ: 'GET',
  UPDATE: 'PUT',
  DELETE: 'DELETE',
} as const;
export type Method = (typeof Method)[keyof typeof Method];

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

    const method = options.method ?? Method.READ;
    const response = await fetch(url.toString(), init);
    const text = await response.text();

    if (!response.ok) {
      const sent = typeof init.body === 'string' ? init.body : undefined;
      throw new BaackApiError(response.status, response.statusText, text, method, url.toString(), sent);
    }

    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * CREATE / POST method for creating resources
   */
  public async create<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, jsonInit(Method.CREATE, body));
  }

  /**
   * READ / GET method for all endpoints. `headers` are added to this request
   * only: a server reading the entity view for a visitor can forward their
   * `Accept-Language`, so the view picks the best available language.
   */
  public async read<T>(endpoint: string, urn: string, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint + urn, { method: Method.READ, ...(headers ? { headers } : {}) }, params);
  }

  /**
   * UPDATE / PUT for updating representations
   */
  public async update<T>(endpoint: string, urn: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint + urn, jsonInit(Method.UPDATE, body));
  }

  /**
   * DELETE for deleting representations
   */
  public async delete<T = undefined>(endpoint: string, urn: string): Promise<T> {
    return this.request<T>(endpoint + urn, {
      method: Method.DELETE,
    });
  }

  /**
   * POST a multipart form, for example an image file upload. The browser sets
   * the multipart Content-Type and boundary itself.
   */
  public async upload<T>(endpoint: string, form: FormData): Promise<T> {
    return this.request<T>(endpoint, { method: Method.CREATE, body: form });
  }

  /**
   * Starts a search (`owner`, `includeScopes`, optional `order`). The result
   * may be partial (`status` before `FULL_RESULT`): read it again with
   * `searchResult` until it is full, and follow its `pagination`.
   */
  public async search(params: Search): Promise<Search> {
    return this.create<Search>(Endpoint.SEARCH, params);
  }

  /** Reads a search's results again by its URN, optionally from a page (`after`). */
  public async searchResult(urn: string, after?: string): Promise<Search> {
    return this.read<Search>(Endpoint.SEARCH, urn, { after });
  }
}

function jsonInit(method: Method, body: unknown): RequestInit {
  return body === undefined ? { method } : { method, body: JSON.stringify(body) };
}
