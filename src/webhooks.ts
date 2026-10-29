/**
 * Webhooks
 * --------
 * Checking that a webhook delivery came from Baack, and setting up Bearer authentication for one.
 *
 * Every delivery is signed: `Signature` is the Base64 HMAC-SHA256, with the subscription's secret, of the raw body,
 * then the `Last-Modified` header (the trigger's time), then the `Idempotency-Key` header (the trigger's URN), as
 * `Signed-Headers` lists them. A subscription can also send credentials in `Authorization`: Bearer (your webhook API
 * client's bearer token, the recommended option) or Basic (the client's ID and the subscription's secret).
 *
 *   const delivery = await verifyWebhook({ body: rawBody, headers: request.headers, secret, bearer: token });
 *   delivery.trigger.event;   // 'CREATE' | 'UPDATE' | 'DELETE'
 *
 * Uses Web Crypto only, so it runs in Node 18+, Cloudflare Workers, Deno, Bun and browsers.
 */

import type { BaackClient } from './client.ts';
import { Endpoint } from './endpoints.ts';
import type { BearerToken, WebhookEvent, WebhookSubject } from './types/index.ts';

/** A link to a record, as a delivery gives it. */
export interface WebhookLink {
  urn: string;
  url: string;
}

/** A delivery's body: what happened (the trigger), the subscription it's for, and a link to the record (`v1`). */
export interface WebhookDelivery {
  trigger: {
    urn: string;
    owner: WebhookLink;
    /** When it happened: ISO 8601 in UTC, with no zone. */
    timestamp: string;
    event: Exclude<WebhookEvent, 'ALL'>;
    subject: WebhookSubject;
    targetUrn: string;
  };
  subscription: WebhookLink;
  /** The record that changed. Its content isn't included: read it with your client's permissions. */
  v1: WebhookLink;
}

/** Why a delivery failed to verify. */
export type WebhookVerificationFailure = 'signed-headers' | 'signature' | 'authorization' | 'body';

export class WebhookVerificationError extends Error {
  constructor(
    readonly reason: WebhookVerificationFailure,
    message: string,
  ) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

/** Headers as Fetch's `Headers`, or as a plain object such as Node's `request.headers`. */
export type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

export interface VerifyWebhookOptions {
  /** The body exactly as received, before any parsing: a string or its bytes. */
  body: string | Uint8Array;
  headers: WebhookHeaders;
  /** The subscription's secret, as it was set. */
  secret: string;
  /**
   * Also require `Authorization: Bearer` with one of these tokens: the client's current one, and the next while you
   * renew it.
   */
  bearer?: string | readonly string[];
  /** Also require `Authorization: Basic` with this client ID and the subscription's secret. */
  basic?: { clientId: string };
}

/** What a delivery signs, in order. */
export const WEBHOOK_SIGNED_HEADERS = 'body,last-modified,idempotency-key';

const encoder = new TextEncoder();

function header(headers: WebhookHeaders, name: string): string | undefined {
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) ?? undefined;
  const value = (headers as Record<string, string | string[] | undefined>)[name] ??
    Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];
  return Array.isArray(value) ? value[0] : value;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** Equal in constant time for equal lengths, so timing doesn't reveal how much of a secret matched. */
function same(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a[index]! ^ b[index]!;
  return difference === 0;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function signature(secret: string, signed: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, signed));
}

/**
 * Checks a webhook delivery and returns its body, parsed. Throws `WebhookVerificationError` when the signature, the
 * signed headers or the required credentials don't match, or the body isn't a delivery. Check the body exactly as
 * received: parsed and re-serialised JSON won't match.
 */
export async function verifyWebhook(options: VerifyWebhookOptions): Promise<WebhookDelivery> {
  const { body, headers, secret } = options;
  if (header(headers, 'signed-headers') !== WEBHOOK_SIGNED_HEADERS) {
    throw new WebhookVerificationError('signed-headers', `Signed-Headers isn't "${WEBHOOK_SIGNED_HEADERS}"`);
  }
  const bytes = typeof body === 'string' ? encoder.encode(body) : body;
  const signed = concat(
    bytes,
    encoder.encode(header(headers, 'last-modified') ?? ''),
    encoder.encode(header(headers, 'idempotency-key') ?? ''),
  );
  const expected = base64(await signature(secret, signed));
  if (!same(encoder.encode(header(headers, 'signature') ?? ''), encoder.encode(expected))) {
    throw new WebhookVerificationError('signature', "The signature doesn't match the subscription's secret");
  }

  const authorization = encoder.encode(header(headers, 'authorization') ?? '');
  if (options.bearer !== undefined) {
    const tokens = typeof options.bearer === 'string' ? [options.bearer] : options.bearer;
    const matched = tokens.map((token) => same(authorization, encoder.encode(`Bearer ${token}`))).some(Boolean);
    if (!matched) throw new WebhookVerificationError('authorization', 'Authorization has none of the bearer tokens');
  }
  if (options.basic) {
    const credentials = base64(encoder.encode(`${options.basic.clientId}:${secret}`));
    if (!same(authorization, encoder.encode(`Basic ${credentials}`))) {
      throw new WebhookVerificationError('authorization', "Authorization isn't the client's Basic credentials");
    }
  }

  try {
    const delivery = JSON.parse(new TextDecoder().decode(bytes)) as WebhookDelivery;
    if (!delivery?.trigger?.urn || !delivery.subscription?.urn) throw new Error('missing trigger or subscription');
    return delivery;
  } catch (error) {
    throw new WebhookVerificationError('body', `The body isn't a webhook delivery: ${(error as Error).message}`);
  }
}

/**
 * Creates a bearer token for a webhook API client, so its subscriptions can deliver with Bearer authentication.
 * Keep the returned `bearerToken` with your endpoint's secrets: it's shown now and never again. Renew it before
 * `expires`, accepting both tokens until the old one ends; without one, deliveries aren't sent and the delivery log
 * records `BEARER_UNAVAILABLE`.
 */
export async function createWebhookBearerToken(
  client: BaackClient,
  apiClient: string | { urn: string },
  expires: Date,
): Promise<BearerToken & { bearerToken: string }> {
  const urn = typeof apiClient === 'string' ? apiClient : apiClient.urn;
  // The API takes date-times in UTC with no zone.
  const expirationTimestamp = expires.toISOString().slice(0, 23);
  const token = await client.create<BearerToken>(Endpoint.BEARER_TOKEN, { apiClient: { urn }, expirationTimestamp });
  if (!token.bearerToken) throw new Error('The API created a bearer token without returning it');
  return token as BearerToken & { bearerToken: string };
}
