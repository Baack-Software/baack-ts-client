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
