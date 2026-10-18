// Type-checked as a consumer would import the published package, to catch
// declaration files that don't resolve (for example their `.ts` imports).
import { BaackClient, Endpoint, EntityView, isBaackApiError, type Entity, type Search } from '@baack-software/baack-ts-client';

const client = new BaackClient({ baseUrl: 'https://api.baack.co' });

export async function title(): Promise<string | undefined> {
  const entity = await client.read<Entity>(Endpoint.ENTITY_VIEW, '/home', { language: 'en-GB', variant: '' });
  return EntityView.from(entity).text('title')?.value;
}

export async function search(params: Search): Promise<boolean | number | undefined> {
  try {
    return (await client.search(params)).pagination?.isMorePages;
  } catch (error) {
    return isBaackApiError(error) ? error.status : undefined;
  }
}
