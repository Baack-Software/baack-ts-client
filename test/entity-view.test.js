import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BaackClient, EntityView } from '@baack-software/baack-ts-client';

const view = EntityView.from({
  urn: 'urn:e',
  name: 'home',
  status: 'PUBLISHED',
  language: 'en-GB',
  publishTimestamp: '2026-01-02T03:04:05Z',
  texts: [
    { name: 'caption', value: 'third', sortOrder: 2 },
    { name: 'title', value: 'Hello', sortOrder: 0 },
    { name: 'caption', value: 'first', sortOrder: 0 },
  ],
  longs: [{ name: 'count', value: 3, sortOrder: 0 }],
});

test('single accessors default to sort order 0', () => {
  assert.equal(view.text('title')?.value, 'Hello');
  assert.equal(view.text('caption')?.value, 'first');
  assert.equal(view.text('caption', 2)?.value, 'third');
  assert.equal(view.text('caption', 1), undefined);
});

test('plural accessors return every item in sort order', () => {
  assert.deepEqual(view.texts('caption').map((t) => t.value), ['first', 'third']);
  assert.deepEqual(view.markdowns('body'), []);
});

test('has checks every collection', () => {
  assert.ok(view.has('count'));
  assert.ok(view.hasText('caption', 2));
  assert.ok(!view.has('missing'));
});

test('number falls back from doubles to longs', () => {
  assert.equal(view.number('count')?.value, 3);
});

test('requireText throws for a missing item', () => {
  assert.throws(() => view.requireText('missing'), /missing required text item "missing" on entity urn:e/);
});

test('metadata', () => {
  assert.equal(view.urn, 'urn:e');
  assert.equal(view.publishedAt?.toISOString(), '2026-01-02T03:04:05.000Z');
  assert.equal(view.updatedAt, undefined);
});

test('fetch passes params and headers to the entity view read', async () => {
  const realFetch = globalThis.fetch;
  let call;
  globalThis.fetch = async (url, init) => {
    call = { url, init };
    return new Response('{"urn":"urn:e","texts":[{"name":"title","value":"Olá","sortOrder":0}]}');
  };
  try {
    const client = new BaackClient({ baseUrl: 'https://api.example.test' });
    const fetched = await EntityView.fetch(client, '/home', { variant: '' }, { 'Accept-Language': 'pt-BR' });

    assert.equal(fetched.text('title')?.value, 'Olá');
    assert.equal(call.url, 'https://api.example.test/v/v1/entityview/home?variant=');
    assert.equal(call.init.headers['Accept-Language'], 'pt-BR');
  } finally {
    globalThis.fetch = realFetch;
  }
});
