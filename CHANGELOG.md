# Changelog

## 0.0.3

- `failureGuard`, on by default: after an invalid request the same request isn't sent again for 5 minutes; after any
  other failure a repeat waits with a doubling, jittered backoff that honours `Retry-After`. Tune it or turn it off in
  `BaackConfig`.
- `BaackApiError` exposes `isInvalidRequest`, `isRefused`, `isRetryable` and `retryAfterMs`.
- Accounts and the account setup form (`Endpoint.ACCOUNT_SETUP`), posted with `client.submitForm`.
- `Endpoint.ADD_USER`: the add user form.
- Per-request headers on create, update and delete; the `BearerToken` type.
- Search: the `COMPANY` scope and result type, plus scopes for webhook triggers and other types.
- Endpoints added from the OpenAPI spec.

## 0.0.2

- Earlier releases; see the git history.
