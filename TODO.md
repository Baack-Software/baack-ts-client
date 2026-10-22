# TODO

## Configurable retries with backoff

`BaackClient` makes one attempt per request. Unattended callers, such as static site builds triggered by publish
webhooks, need to ride out the API being over capacity or briefly unreachable. Add an optional, off-by-default retry
setting that retries rate limits, server errors and network failures with backoff, honouring `Retry-After`.

## `tr()`: transpose an entity's items by name

Plain `fetch` users get the entity shape back, with items grouped by type. Add a small exported helper that transposes
it into values keyed by item name, so they can destructure without learning the content model:

```ts
const { title: [title], body: [body] } = tr(await res.json())
```

## Make write and `ALL` permission tokens clearly server-side only

A token whose role can write, or has `ALL` permissions, belongs only in server-side configuration (`.env`, a build or
deploy secret), never in code that ships to a browser. Document the split more clearly and make it harder to ship
write access to a browser by accident.
