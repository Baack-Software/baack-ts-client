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
  assert.equal(calls[0].url, 'https://api.example.test/v/v1/entityview//home?language=en-GB&variant=');
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
