import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { WebhookVerificationError, createWebhookBearerToken, verifyWebhook } from '@baack-software/baack-ts-client';

// A delivery as Baack sends one (the shape of a real one captured on 29 Oct 2026), signed here independently with
// node:crypto: HMAC-SHA256 over the body, then Last-Modified, then Idempotency-Key, in Base64.
const secret = 'test-secret-0123456789abcdef';
const body = JSON.stringify({
  trigger: {
    urn: 'ea8c1fed-af5d-44f1-a04a-de4f0a52ee97',
    owner: { urn: 'c-1', url: '/n/v1/company/c-1' },
    timestamp: '2026-10-29T12:31:43.829',
    event: 'CREATE',
    subject: 'ENTITY',
    targetUrn: 'e-1',
  },
  subscription: { urn: 's-1', url: '/n/v1/webhooksubscription/s-1' },
  v1: { urn: 'e-1', url: '/n/v1/entity/e-1' },
});
const sign = (data, key = secret) =>
  createHmac('sha256', key).update(data + '2026-10-29T12:31:43.829' + 'ea8c1fed-af5d-44f1-a04a-de4f0a52ee97').digest('base64');
const headers = (extra = {}) => ({
  'content-type': 'application/json; charset=UTF-8',
  authorization: 'Signature',
  'idempotency-key': 'ea8c1fed-af5d-44f1-a04a-de4f0a52ee97',
  'last-modified': '2026-10-29T12:31:43.829',
  signature: sign(body),
  'signed-headers': 'body,last-modified,idempotency-key',
  'x-attempt-number': '0',
  'x-attempts-remaining': '9',
  ...extra,
});
const reason = (promise) =>
  promise.then(
    () => 'verified',
    (error) => (error instanceof WebhookVerificationError ? error.reason : String(error)),
  );

test('verifies a signed delivery and returns its body, with plain or Fetch headers, as text or bytes', async () => {
  const delivery = await verifyWebhook({ body, headers: headers(), secret });
  assert.equal(delivery.trigger.event, 'CREATE');
  assert.equal(delivery.v1.urn, 'e-1');
  assert.equal(await reason(verifyWebhook({ body, headers: new Headers(headers()), secret })), 'verified');
  assert.equal(await reason(verifyWebhook({ body: new TextEncoder().encode(body), headers: headers(), secret })), 'verified');
});

test('refuses a wrong secret, a changed body or different signed headers', async () => {
  assert.equal(await reason(verifyWebhook({ body, headers: headers(), secret: 'wrong' })), 'signature');
  assert.equal(await reason(verifyWebhook({ body: body.replace('CREATE', 'DELETE'), headers: headers(), secret })), 'signature');
  assert.equal(await reason(verifyWebhook({ body, headers: headers({ 'signed-headers': 'body' }), secret })), 'signed-headers');
  assert.equal(await reason(verifyWebhook({ body, headers: headers({ signature: sign(body, 'wrong') }), secret })), 'signature');
});

test('checks Bearer credentials, accepting the next token while renewing', async () => {
  const bearer = headers({ authorization: 'Bearer token-current' });
  assert.equal(await reason(verifyWebhook({ body, headers: bearer, secret, bearer: 'token-current' })), 'verified');
  assert.equal(await reason(verifyWebhook({ body, headers: bearer, secret, bearer: ['token-next', 'token-current'] })), 'verified');
  assert.equal(await reason(verifyWebhook({ body, headers: bearer, secret, bearer: 'token-other' })), 'authorization');
  assert.equal(await reason(verifyWebhook({ body, headers: headers(), secret, bearer: 'token-current' })), 'authorization');
});

test('checks Basic credentials: the client ID and the subscription secret', async () => {
  const basic = headers({ authorization: 'Basic ' + Buffer.from(`webhooks-client:${secret}`).toString('base64') });
  assert.equal(await reason(verifyWebhook({ body, headers: basic, secret, basic: { clientId: 'webhooks-client' } })), 'verified');
  assert.equal(await reason(verifyWebhook({ body, headers: basic, secret, basic: { clientId: 'other' } })), 'authorization');
});

test('creates a bearer token for a webhook client, expiring in UTC with no zone', async () => {
  const sent = [];
  const client = { create: async (endpoint, payload) => (sent.push({ endpoint, payload }), { urn: 't-1', bearerToken: 'secret-token' }) };
  const token = await createWebhookBearerToken(client, 'client-1', new Date('2026-12-01T10:15:30.123Z'));
  assert.equal(token.bearerToken, 'secret-token');
  assert.deepEqual(sent, [{ endpoint: '/n/v1/bearertoken/', payload: { apiClient: { urn: 'client-1' }, expirationTimestamp: '2026-12-01T10:15:30.123' } }]);
});
