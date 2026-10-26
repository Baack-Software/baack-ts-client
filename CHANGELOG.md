# Changelog

## 0.0.6

- `Endpoint.DEAL`, `Endpoint.LEAD` and `Endpoint.INVOICE_LINE`.
- Sales and invoicing types: `Lead`, `Deal` (its `leadSource` is a `Lead`), `Money`, `PaymentInvoice`,
  `PaymentInvoiceLine`, `PaymentInvoiceIdentifier`, `Remitter` and `Recipient`, with their status unions.
- `MessageThread.invoices`.
- Search: the `DEAL`, `LEAD` and `PAYMENT_INVOICE` scopes and result types.
- `ApiCode` `NOT_AUTHORISED`.
- `ImageItemFile` for image uploads, and `WebhookEventEnvelope` for webhook deliveries.

## 0.0.5

- `Endpoint.PROJECT`.
- The `TemplateItemHistory` type; `TemplateItem.history` is now a `TemplateItemHistory`.
- `MessageThreadNotification`, an alias of `ThreadNotification` named after its endpoint.

## 0.0.4

- Breaking: `Identity.name` is now `Identity.label`, to match its use as the identity's label.

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
