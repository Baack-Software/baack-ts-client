# TODO

## Configurable retries with backoff

`BaackClient` makes one attempt per request. Unattended callers, such as static site builds triggered by publish
webhooks, need to ride out the API being over capacity or briefly unreachable.

- Add an optional retry setting to `BaackConfig`, e.g. `retry: { attempts, baseDelayMs, maxDelayMs }`, off by default.
- Retry 429 and 5xx responses and network failures (`fetch` rejecting with a `TypeError`); never other 4xx responses.
- Back off exponentially with jitter, and honour a `Retry-After` header when the API sends one.
- Only retry idempotent operations by default (`read`); creates and updates opt in.
- Allow a custom `fetch` in `BaackConfig`, so callers can test without replacing the global one.

## `tr()`: transpose an entity's items by name

Plain `fetch` users get the entity shape back, with items grouped by type:
`{ texts: [{ name: 'title', sortOrder: 0, value: 'Some value' }], markdowns: [...] }`. Add a small exported helper
that transposes it into values keyed by item name, so they can destructure without learning the content model:

```ts
const { title: [title], body: [body] } = tr(await res.json())
```

- Return `{ [name]: value[] }`, each array in `sortOrder`, across every item collection (texts, markdowns, images,
  links, money, ...). Decide what a value is per type: the scalar for texts and markdowns, the item for images, links
  and money.
- Have no runtime dependencies, so it can also ship as a tiny standalone snippet for `fetch` users.
- Document what happens when two collections use the same name.

## Make write and `ALL` permission tokens clearly server-side only

The README says to keep tokens server-side or use a read-only API client in the browser, but nothing in the client
enforces or reinforces it. A token whose role can write, or has `ALL` permissions, belongs only in server-side
configuration (`.env`, a build or deploy secret), never in code that ships to a browser.

- Document the split up front: read-only API clients for browser and runtime reads; write and `ALL` tokens only in
  server-side env for builds, content sync and admin scripts. Name the env variables to match, e.g.
  `BAACK_API_CLIENT_TOKEN` (read) and `BAACK_WRITE_TOKEN` (write).
- Warn when the client runs in a browser (`typeof window !== 'undefined'`) with a token the API reports as able to
  write, or when a write method is called there. Needs a way to learn a token's permissions, e.g. an introspection
  endpoint, or the API's 403 answers.
- Consider separate entry points or types for reading and writing, so browser bundles can't reach write methods by
  accident.
