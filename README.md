The [Baack](https://www.baack.co) TypeScript client is provided to allow native typescript integrations using Baack as their content or digital experience backed.

Baack offers digital experiences for:

* Content management.
  * Rich content type modelling ( Text, Markdown, Templates, Money, numbers, dates, boolean, Lat / Long etc).
  * Full version history.
  * Preview drafts.
  * 
* Customer relationship management API: model your customers and employees with a rich identity model.
* Project and task management: build internal ticketing or task workflows for content authoring jobs.
* Community groups and message threads: create interest groups with notification opt in, internal work groups or start a discussion thread about any concept on the platform like future plans for a content entity.

## Usage

The Baack client provides a baseline for managing content and experience related representations based on the permissions
of the client connecting to the platform.

```typescript
import { BaackClient, Endpoint, EntityView, type Entity } from '@baack-software/baack-ts-client';

// Configure the client with your API client's bearer token. Keep the token server-side, or use a read-only
// API client for code that runs in the browser.
const client = new BaackClient({
  baseUrl: 'https://api.baack.co',
  headers: { Authorization: `Bearer ${process.env['BAACK_API_CLIENT_TOKEN']}` },
});

// Read a page's content by path, language and variant ('' is the default variant).
const entity = await client.read<Entity>(Endpoint.ENTITY_VIEW, '/home', {
  language: 'en-GB',
  variant: '',
});

// EntityView gives name-based access to the entity's content items.
const view = EntityView.from(entity);
const title = view.text('title')?.value;
const body = view.markdown('body')?.value; // rendered HTML
```

The entity view endpoint takes a path (for example `/home`) or an entity URN. Most of the time you'll use the
combination of path, `language` and `variant`. The API respects the `language` parameter, or the reader's
`Accept-Language` preferences, so it can return a different language version from the one you addressed: request an
en-US entity's URN from a browser that prefers pt-BR and, if a pt-BR version exists, you'll get that entity, with its
own URN. When you send both, `language` comes first and the `Accept-Language` preferences are the fallbacks. Check
`entity.language` and `entity.urn` to see which version came back. Pass `version: 'LATEST'` to read the latest version,
including unpublished drafts, for previews.

A URN or path is a locator, not a promise of that exact entity: even `GET /v/v1/entityview/<urn-of-an-en-GB-entity>`
can return a de-DE entity with its own URN. Always key on the returned `urn`. A browser sends its own
`Accept-Language`; a server or proxy reading with a read-only token on a visitor's behalf can forward theirs:

```typescript
const entity = await client.read<Entity>(Endpoint.ENTITY_VIEW, '/home', { variant: '' }, {
  'Accept-Language': request.headers.get('Accept-Language') ?? 'en-GB',
});
```

The view also returns `alternativeLanguages`: the other language versions of the returned entity, in the same variant,
for `<link rel="alternate" hreflang>`. Map each to a URL however your site routes languages.

Responses are shallow: a linked object is the same type with only its `urn` (and `url`) set, never expanded. An
entity list (`Endpoint.ENTITY_LIST`) returns each `entity` that way, so read each entity's view to render it; a text
item read from its own endpoint has a parent `entity` reference, and inside an entity's `texts` it has none. The API
is permissive in the other direction: send full objects where a link is expected and it stores only their URNs.

`EntityView` hides the raw content representation's navigation: `view.text(name)`, `view.markdown(name)`,
`view.image(name)` and the other accessors return the item at sort order 0, or pass a sort order to reach a
repeated field (`view.text('caption', 2)`, or `view.texts('caption')` for all of them). We're working on more helpers
for frameworks like Astro, Next and React; please request specific approaches via the issues.

### Errors

Any non-2xx response throws a `BaackApiError` carrying the HTTP `status`, the raw response `body`, the API error object
(`apiError`, with `apiCode`, `detail` and `httpCode`; `detail` is also available directly), and the request `method` and
`url`, so you can react to the cause rather than parse a message. Note that the API answers `404` when a request lacks
the session or permission it needs:

```typescript
import { isBaackApiError } from '@baack-software/baack-ts-client';

try {
  await client.update(Endpoint.TEXT, item.urn, item);
} catch (error) {
  if (isBaackApiError(error) && error.isUnauthorized) {
    // session expired: prompt to log in, keep the user's changes
  } else {
    throw error;
  }
}
```

A network failure (no response at all) rejects with fetch's own error. An empty response body, such as a `204` from a
delete, resolves to `undefined`.

### Browser use with a Baack session

A browser client on another origin that relies on the user's Baack session needs `credentials: 'include'`:

```typescript
const client = new BaackClient({ baseUrl: 'https://api.baack.co', credentials: 'include' });
```

`client.upload(endpoint, formData)` posts a multipart form, for example an image file.

## Feedback 
We welcome feedback, please create feature requests and issues in GitHub to allow them to be easily tracked.

