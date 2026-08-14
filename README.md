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

  // Initialise a config 
  let config = new BaackConfig('https://api.baack.co', 
      process.env['BAACK_API_CLIENT_TOKEN']);
  let client = new BaackClient(config);
  
  // Fetch a entity view for a page style context
  let content = client.read<Entity>(Endpoint.ENTITY_VIEW, '/home');
  
```

We are currently working on helpers to make consuming content in common frameworks
like Astro / Next / React easier as the raw content representation requires some 
navigation. Please feel free to request specific approaches via the issues.

## Feedback 
We welcome feedback, please create feature requests and issues in GitHub to allow them to be easily tracked.

