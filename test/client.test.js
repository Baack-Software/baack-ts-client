import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { BaackClient, BaackApiError, Endpoint, isBaackApiError } from '@baack-software/baack-ts-client';

const realFetch = globalThis.fetch;
let calls;

function respond(status, body = '') {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(body === '' ? null : body, { status });
  };
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const client = new BaackClient({ baseUrl: 'https://api.example.test/', headers: { Authorization: 'Bearer t' } });

test('read builds the URL, drops empty params and sends no Content-Type', async () => {
  respond(200, '{"urn":"urn:e"}');
  const entity = await client.read(Endpoint.ENTITY_VIEW, '/home', { language: 'en-GB', variant: '', missing: undefined });

  assert.deepEqual(entity, { urn: 'urn:e' });
  assert.equal(calls[0].url, 'https://api.example.test/v/v1/entityview/home?language=en-GB&variant=');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t');
  assert.equal(calls[0].init.headers['Content-Type'], undefined);
});

test('read adds per-request headers', async () => {
  respond(200, '{}');
  await client.read(Endpoint.ENTITY_VIEW, '/home', undefined, { 'Accept-Language': 'pt-BR' });

  assert.equal(calls[0].init.headers['Accept-Language'], 'pt-BR');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t');
});

test('update sends a JSON body', async () => {
  respond(200, '{"name":"title"}');
  await client.update(Endpoint.TEXT, 'urn:t', { name: 'title' });

  assert.equal(calls[0].url, 'https://api.example.test/n/v1/textitem/urn:t');
  assert.equal(calls[0].init.method, 'PUT');
  assert.equal(calls[0].init.body, '{"name":"title"}');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
});

test('an empty response body resolves to undefined', async () => {
  respond(204);
  assert.equal(await client.delete(Endpoint.TEXT, 'urn:t'), undefined);
});

test('credentials are passed through when configured', async () => {
  respond(200, '{}');
  await new BaackClient({ baseUrl: 'https://api.example.test', credentials: 'include' }).read(Endpoint.ENTITY, 'urn:e');

  assert.equal(calls[0].init.credentials, 'include');
});

test('a non-2xx response throws BaackApiError with the API error', async () => {
  respond(401, '{"apiCode":"UNAUTHORIZED","detail":"Session expired","httpCode":401}');
  const error = await client.create(Endpoint.TEXT, { name: 'title' }).catch((e) => e);

  assert.ok(isBaackApiError(error));
  assert.ok(error instanceof BaackApiError);
  assert.equal(error.status, 401);
  assert.ok(error.isUnauthorized);
  assert.equal(error.detail, 'Session expired');
  assert.equal(error.method, 'POST');
  assert.equal(error.requestBody, '{"name":"title"}');
});

test('a non-JSON error body has no API error', async () => {
  respond(502, 'Bad Gateway');
  const error = await client.read(Endpoint.ENTITY, 'urn:e').catch((e) => e);

  assert.ok(error.isServerError);
  assert.equal(error.apiError, undefined);
  assert.equal(error.detail, undefined);
});

const MISSING_FIELD = '{"httpCode":400,"apiCode":"REPRESENTATION_MISSING_REQUIRED_FIELD","detail":"updatedTimestamp"}';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('a refused request is permanent: the same request is not sent again', async () => {
  respond(400, MISSING_FIELD);
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test' });
  const body = { urn: 'n1', notificationCount: 0 };

  const first = await guarded.update(Endpoint.MESSAGE_THREAD_NOTIFICATION, 'n1', body).catch((error) => error);
  assert.ok(isBaackApiError(first));
  assert.equal(first.isRefused, true);
  assert.equal(first.isRetryable, false);
  assert.equal(first.apiError.apiCode, 'REPRESENTATION_MISSING_REQUIRED_FIELD');
  assert.equal(first.detail, 'updatedTimestamp');

  // A caller looping on it gets the same error at once, without another request.
  for (let i = 0; i < 20; i++) {
    const again = await guarded.update(Endpoint.MESSAGE_THREAD_NOTIFICATION, 'n1', body).catch((error) => error);
    assert.equal(again, first);
  }
  assert.equal(calls.length, 1);

  // Acting on the error (sending the missing field) is a different request, so it's sent.
  respond(200, '{"urn":"n1"}');
  await guarded.update(Endpoint.MESSAGE_THREAD_NOTIFICATION, 'n1', { ...body, updatedTimestamp: '2026-10-19T12:00:00' });
  assert.equal(calls.length, 2);
});

test('after a server error the same request backs off, doubling, then is sent again', async () => {
  respond(503, '');
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test', failureGuard: { backoffMs: 40 } });
  const first = await guarded.read(Endpoint.ENTITY, 'e1').catch((error) => error);
  assert.equal(first.isRetryable, true);
  assert.equal(first.isRefused, false);
  assert.equal(await guarded.read(Endpoint.ENTITY, 'e1').catch((error) => error), first);
  assert.equal(calls.length, 1);

  await wait(50);
  await guarded.read(Endpoint.ENTITY, 'e1').catch(() => undefined);
  assert.equal(calls.length, 2);
  // The second wait is 80 ms: still held after 50.
  await wait(50);
  await guarded.read(Endpoint.ENTITY, 'e1').catch(() => undefined);
  assert.equal(calls.length, 2);

  respond(200, '{"urn":"e1"}');
  // Up to 96 ms with jitter.
  await wait(50);
  assert.deepEqual(await guarded.read(Endpoint.ENTITY, 'e1'), { urn: 'e1' });
  assert.equal(calls.length, 3);

  // A success clears the record: after the next failure, the wait is back to the first (40 ms, not 160).
  respond(503, '');
  await guarded.read(Endpoint.ENTITY, 'e1').catch(() => undefined);
  await wait(50);
  await guarded.read(Endpoint.ENTITY, 'e1').catch(() => undefined);
  assert.equal(calls.length, 5);
});

test('an invalid request says until when it is held', async () => {
  respond(400, MISSING_FIELD);
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test' });
  const before = Date.now();
  const error = await guarded.read(Endpoint.ENTITY, 'e1').catch((e) => e);
  assert.equal(error.isInvalidRequest, true);
  assert.ok(error.heldUntil >= before + 300_000);
});

test('other refusals back off rather than hold: a 401 is sent again once the wait has passed', async () => {
  respond(401, '{"apiCode":"UNAUTHORIZED","detail":"Session expired","httpCode":401}');
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test', failureGuard: { backoffMs: 40 } });
  const first = await guarded.read(Endpoint.ENTITY, 'e1').catch((e) => e);
  assert.equal(first.isRefused, true);
  assert.equal(first.isInvalidRequest, false);
  assert.ok(first.heldUntil <= Date.now() + 48);
  assert.equal(await guarded.read(Endpoint.ENTITY, 'e1').catch((e) => e), first);
  assert.equal(calls.length, 1);

  // Signed in again: the same request goes through.
  respond(200, '{"urn":"e1"}');
  await wait(50);
  assert.deepEqual(await guarded.read(Endpoint.ENTITY, 'e1'), { urn: 'e1' });
});

test('a Retry-After longer than the backoff is honoured', async () => {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(null, { status: 429, headers: { 'Retry-After': '120' } });
  };
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test' });
  const before = Date.now();
  const error = await guarded.read(Endpoint.ENTITY, 'e1').catch((e) => e);
  assert.equal(error.retryAfterMs, 120_000);
  assert.ok(error.heldUntil >= before + 120_000);
});

test('the same request with different per-request headers is a different request', async () => {
  respond(400, MISSING_FIELD);
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test' });
  await assert.rejects(guarded.update(Endpoint.TASK, 't1', { name: 'a' }));
  // Sending the missing CSRF header, say, is sent, even with the same body.
  await assert.rejects(guarded.update(Endpoint.TASK, 't1', { name: 'a' }, { 'X-Baack-Request': '1' }));
  await assert.rejects(guarded.read(Endpoint.ENTITY_VIEW, '/home', undefined, { 'Accept-Language': 'en-GB' }));
  await assert.rejects(guarded.read(Endpoint.ENTITY_VIEW, '/home', undefined, { 'Accept-Language': 'pt-BR' }));
  assert.equal(calls.length, 4);
  await assert.rejects(guarded.read(Endpoint.ENTITY_VIEW, '/home', undefined, { 'Accept-Language': 'pt-BR' }));
  assert.equal(calls.length, 4);
});

test('uploads are not guarded: a refused upload does not hold back other files', async () => {
  respond(413, '');
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test' });
  const form = () => {
    const data = new FormData();
    data.append('file', new Blob(['x']), 'a.png');
    return data;
  };
  await assert.rejects(guarded.upload(Endpoint.IMAGE, form()));
  await assert.rejects(guarded.upload(Endpoint.IMAGE, form()));
  assert.equal(calls.length, 2);
});

test('network failures back off too', async () => {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    throw new TypeError('fetch failed');
  };
  const guarded = new BaackClient({ baseUrl: 'https://api.example.test' });
  await assert.rejects(guarded.read(Endpoint.ENTITY, 'e1'), TypeError);
  await assert.rejects(guarded.read(Endpoint.ENTITY, 'e1'), TypeError);
  assert.equal(calls.length, 1);
});

test('failureGuard: false sends every request', async () => {
  respond(400, MISSING_FIELD);
  const unguarded = new BaackClient({ baseUrl: 'https://api.example.test', failureGuard: false });
  await assert.rejects(unguarded.read(Endpoint.ENTITY, 'e1'));
  await assert.rejects(unguarded.read(Endpoint.ENTITY, 'e1'));
  assert.equal(calls.length, 2);
});

test('submitForm posts a urlencoded body to the path, never the URL, and reads refused fields', async () => {
  respond(400, '{"httpCode":400,"apiCode":"REPRESENTATION_MISSING_REQUIRED_FIELD","fields":[{"name":"company-name"}]}');
  const form = new URLSearchParams({ 'company-name': '', 'person-telephone': '+447890123456' });
  const error = await client
    .submitForm(`${Endpoint.ACCOUNT_SETUP}/acc-1`, form, { 'X-Baack-Request': '1' })
    .catch((e) => e);

  assert.equal(calls[0].url, 'https://api.example.test/form/account-setup/acc-1');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, 'company-name=&person-telephone=%2B447890123456');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(calls[0].init.headers['X-Baack-Request'], '1');
  assert.deepEqual(error.apiError.fields, [{ name: 'company-name' }]);
});

test('create, update and delete add per-request headers, keeping the JSON Content-Type', async () => {
  respond(200, '{}');
  await client.create(Endpoint.TASK, { name: 'a' }, { 'X-Baack-Request': '1' });
  await client.update(Endpoint.TASK, 't-1', { name: 'b' }, { 'X-Baack-Request': '1' });
  await client.delete(Endpoint.TASK, 't-1', { 'X-Baack-Request': '1' });

  for (const call of calls) assert.equal(call.init.headers['X-Baack-Request'], '1');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.equal(calls[1].url, 'https://api.example.test/n/v1/task/t-1');
  assert.equal(calls[2].init.method, 'DELETE');
});
