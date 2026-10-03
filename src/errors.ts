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
  ) {
    super(`Baack API Error [${status}]: ${body || statusText}`);
  }

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

export function isBaackApiError(error: unknown): error is BaackApiError {
  return error instanceof BaackApiError;
}
