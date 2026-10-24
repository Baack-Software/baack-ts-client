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

## Item history `UPDATE`: the schema documents the wrong types

`PUT` on an item history endpoint (`Endpoint.TEXT_HISTORY` and the other `*_HISTORY` endpoints) reads only the URN
from the URL, sets that version live and answers with the promoted live item (for example a `TextItem`). The draft
OpenAPI schema still documents the history type as the request body and, for most of them, as the response;
`latlongitemhistory` and `markdownitemhistory` answer `noop`, and only `moneyitemhistory` answers the live item
(`moneyitem`). The schema generator needs to let a verb spec override the endpoint's payload types, so history `UPDATE`
takes no body and returns the live item type. Until then, don't derive client types for these from the schema.

## Make write and `ALL` permission tokens clearly server-side only

A token whose role can write, or has `ALL` permissions, belongs only in server-side configuration (`.env`, a build or
deploy secret), never in code that ships to a browser. Document the split more clearly and make it harder to ship
write access to a browser by accident.
