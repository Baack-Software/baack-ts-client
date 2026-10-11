# TODO

## Configurable retries with backoff

`BaackClient` makes one attempt per request. Unattended callers, such as static site builds triggered by publish
webhooks, need to ride out the API being over capacity or briefly unreachable.

- Add an optional retry setting to `BaackConfig`, e.g. `retry: { attempts, baseDelayMs, maxDelayMs }`, off by default.
- Retry 429 and 5xx responses and network failures (`fetch` rejecting with a `TypeError`); never other 4xx responses.
- Back off exponentially with jitter, and honour a `Retry-After` header when the API sends one.
- Only retry idempotent operations by default (`read`); creates and updates opt in.
- Allow a custom `fetch` in `BaackConfig`, so callers can test without replacing the global one.

Until then, www-baack-co-cas retries in its own wrapper (`src/lib/baack/api.ts`, `createBaackReader`); drop that loop
once the client supports retries.

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

www.baack.co's home hero shows it as "(planned)" in its fetch example (`src/components/islands/HeroContentDemo.tsx`);
drop that once it ships.
