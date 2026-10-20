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
  /**
   * Stops a failed request being sent again and again, for example by a caller that retries on every render. On by
   * default; `false` turns it off.
   *
   * - A refused request (`BaackApiError.isRefused`: a 4xx such as a missing required field) is permanent: the same
   *   request (method, URL and body) isn't sent again for `refusedHoldMs`, and fails at once with the same error.
   * - After a server error, timeout, rate limit or network failure, the same request waits `backoffMs`, doubling with
   *   each failure in a row up to `maxBackoffMs`, and fails at once with the last error until then.
   *
   * A different request (another body, URL or method) is always sent, and a success clears the request's record.
   * The client doesn't retry by itself.
   */
  failureGuard?: FailureGuard | false;
}

export interface FailureGuard {
  /** How long a refused request isn't sent again unchanged. Default 5 minutes. */
  refusedHoldMs?: number;
  /** The wait after the first failure that may pass. Default 1 second. */
  backoffMs?: number;
  /** The longest wait. Default 1 minute. */
  maxBackoffMs?: number;
}

const GUARD_DEFAULTS: Required<FailureGuard> = { refusedHoldMs: 300_000, backoffMs: 1_000, maxBackoffMs: 60_000 };

/** The most failed requests a client remembers; the oldest is forgotten first. */
const MAX_REMEMBERED_FAILURES = 500;

interface FailedRequest {
  error: unknown;
  /** No request before this time (ms since the epoch). */
  until: number;
  /** Failures in a row. */
  failures: number;
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

export type QueryParams =Record<string, string | number | boolean | null | undefined>;

export class BaackClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private credentials: BaackConfig['credentials'];
  private guard: Required<FailureGuard> | undefined;
  /** Recently failed requests, by method, URL and body. */
  private failed = new Map<string, FailedRequest>();

  constructor(config: BaackConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = { ...config.headers };
    this.credentials = config.credentials;
    this.guard = config.failureGuard === false ? undefined : { ...GUARD_DEFAULTS, ...config.failureGuard };
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
    const sent = typeof init.body === 'string' ? init.body : undefined;
    const key = `${method} ${url.toString()} ${sent ?? ''}`;
    const held = this.guard && this.failed.get(key);
    if (held && Date.now() < held.until) throw held.error;

    let response: Response;
    try {
      response = await fetch(url.toString(), init);
    } catch (error) {
      // A network failure (fetch rejects with a TypeError): transient, so back off.
      this.recordFailure(key, error, false);
      throw error;
    }
    const text = await response.text();

    if (!response.ok) {
      const error = new BaackApiError(response.status, response.statusText, text, method, url.toString(), sent);
      this.recordFailure(key, error, error.isRefused);
      throw error;
    }

    this.failed.delete(key);
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** Remembers a failed request, so the guard can hold back the same request (see `BaackConfig.failureGuard`). */
  private recordFailure(key: string, error: unknown, refused: boolean): void {
    if (!this.guard) return;
    const failures = (this.failed.get(key)?.failures ?? 0) + 1;
    const wait = refused
      ? this.guard.refusedHoldMs
      : Math.min(this.guard.backoffMs * 2 ** (failures - 1), this.guard.maxBackoffMs);
    this.failed.delete(key);
    this.failed.set(key, { error, until: Date.now() + wait, failures });
    if (this.failed.size > MAX_REMEMBERED_FAILURES) this.failed.delete(this.failed.keys().next().value!);
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
    return this.request<T>(join(endpoint, urn), { method: Method.READ, ...(headers ? { headers } : {}) }, params);
  }

  /**
   * UPDATE / PUT for updating representations
   */
  public async update<T>(endpoint: string, urn: string, body?: unknown): Promise<T> {
    return this.request<T>(join(endpoint, urn), jsonInit(Method.UPDATE, body));
  }

  /**
   * DELETE for deleting representations
   */
  public async delete<T = undefined>(endpoint: string, urn: string): Promise<T> {
    return this.request<T>(join(endpoint, urn), {
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
   * POST a urlencoded form, such as the account setup form, asking for JSON back. The fields go in the request body,
   * never the URL. `headers` are added to this request only. A refused form answers with an `ApiError` whose
   * `fields` name the fields at fault.
   */
  public async submitForm<T>(endpoint: string, form: URLSearchParams, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: Method.CREATE,
      body: form.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    });
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

/**
 * Appends a URN or path to an endpoint. Endpoints end with a slash and paths
 * such as '/home' start with one, so drop the duplicate: the API accepts
 * either, but one slash is the canonical URL.
 */
function join(endpoint: string, urn: string): string {
  return endpoint.endsWith('/') && urn.startsWith('/') ? endpoint + urn.slice(1) : endpoint + urn;
}

function jsonInit(method: Method, body: unknown): RequestInit {
  return body === undefined ? { method } : { method, body: JSON.stringify(body) };
}
