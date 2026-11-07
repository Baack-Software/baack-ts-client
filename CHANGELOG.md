# Changelog

## Unreleased

- Needs Node 20 or later (`engines.node` is now `>=20`). Node 18, end of life since April 2025, has no global `crypto`,
  so `verifyWebhook` and `createWebhookBearerToken` never worked there, whatever 0.0.8 said.

## 0.0.12

- `Search.context` and `SearchContext`: limits a search to what is related to the given entities, their tasks (as
  references) and the people related to them (author, contributors and the assignees of their tasks).

## 0.0.11

- `ClientContext.userIdentities` and `CompanyIdentity`: the signed-in user's identity in each company they administer,
  which they post and act as there, created with their account at setup.

## 0.0.10

- `Endpoint.STAT_SEATS`: the users of a root company and its child companies each day (`USER_COUNT`), as plans bill
  them: against the most on any day of a month.

## 0.0.9

- `Endpoint.STAT_SIZE`: a company's storage, the bytes stored each day per type of record, as storage is billed.
- `RechartData` and `RechartPoint`, the API's `rechartdata`, which every stats endpoint answers with. A point's value
  can be null. `UsageStats` and `UsagePoint` are now deprecated aliases of them.

## 0.0.8

- `verifyWebhook` checks a webhook delivery's `Signature` (and, optionally, its Bearer or Basic `Authorization`) and
  returns the parsed `WebhookDelivery`; it throws a `WebhookVerificationError` with the `reason` when it fails. Uses
  Web Crypto only, so it runs in Node 18+, Cloudflare Workers, Deno, Bun and browsers.
- `createWebhookBearerToken` creates a bearer token for a webhook API client, for Bearer-authenticated deliveries.

## 0.0.7

- `Endpoint.INVOICE_REMITTANCE` and `PaymentInvoiceRemittance` (with `RemittanceDirection`, `RemittanceStatus` and
  `RemittanceMethod`): payments and refunds against a payment invoice, listed in `PaymentInvoice.remittances`.
- `Deal.stage` is now `Deal.workflowStage`, as the API names it and as tasks have it.

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
