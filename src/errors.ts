import type { ApiError } from './types/index.ts';

/**
 * Thrown for any non-2xx response from the Baack API. Carries the HTTP status
 * so callers can tell an expired session (401) from a missing permission (403),
 * a conflict (409) or a server failure (5xx).
 *
 * Network failures (no response at all) are not wrapped: `fetch` rejects with
 * its own error, typically a `TypeError`.
 */
export class BaackApiError extends Error {
  override readonly name = 'BaackApiError';

  constructor(
    readonly status: number,
    readonly statusText: string,
    /** The raw response body, which may be a JSON error document or empty. */
    readonly body: string,
    readonly method: string,
    readonly url: string,
    /** The JSON body that was sent, when there was one, for debugging (not multipart uploads). */
    readonly requestBody?: string,
    /** How long the API asked callers to wait before trying again (its `Retry-After` header), when it said. */
    readonly retryAfterMs?: number,
  ) {
    super(`Baack API Error [${status}]: ${body || statusText}`);
  }

  /**
   * When the client's `failureGuard` holds this request back, the time (ms since the epoch) before which the same
   * request isn't sent again: until then it fails at once with this error. Use it to tell the user when to try again.
   */
  heldUntil?: number;

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409 || this.status === 412;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Whether the API refused the request: a 4xx other than a timeout (408) or rate limit (429). Some refusals depend
   * on state outside the request, such as an expired session (401) or a missing entity (404), and the same request
   * may succeed later; an invalid request (`isInvalidRequest`) never does.
   */
  get isRefused(): boolean {
    return this.status >= 400 && this.status < 500 && this.status !== 408 && this.status !== 429;
  }

  /**
   * Whether the request itself is invalid (400, 405, 413, 414, 415, 422 or 431), for example a missing required field
   * or an invalid representation; `apiError` says which. This is permanent: sending the same request again breaks the
   * contract again, so act on `apiError` (its `apiCode` and `detail`) or change the request, and never loop on it.
   */
  get isInvalidRequest(): boolean {
    return INVALID_REQUEST_STATUSES.has(this.status);
  }

  /** Whether the same request may succeed later: a server error, a timeout (408) or a rate limit (429). */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 408 || this.status === 429;
  }

  /** The API error object from the body, when there is one. */
  get apiError(): ApiError | undefined {
    const parsed = this.json<ApiError>();
    return parsed !== null && typeof parsed === 'object' ? parsed : undefined;
  }

  /** The API's description of the problem, when it gave one. */
  get detail(): string | undefined {
    const detail = this.apiError?.detail;
    return typeof detail === 'string' && detail !== '' ? detail : undefined;
  }

  /** The body parsed as JSON, or undefined when it is empty or not JSON. */
  json<T = unknown>(): T | undefined {
    if (!this.body) return undefined;
    try {
      return JSON.parse(this.body) as T;
    } catch {
      return undefined;
    }
  }
}

/** Statuses that say the request itself is invalid, so sending it again unchanged gets the same answer. */
const INVALID_REQUEST_STATUSES = new Set([400, 405, 413, 414, 415, 422, 431]);

export function isBaackApiError(error: unknown): error is BaackApiError {
  return error instanceof BaackApiError;
}
