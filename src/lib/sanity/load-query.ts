// Alle content via deze functie, nooit direct via sanityClient.fetch (_standards/SANITY.md §3).
import type { QueryParams } from '@sanity/client';
import { sanityClient } from 'sanity:client';
import { isVisualEditing, requestCache } from './visual-editing';

const token = import.meta.env.SANITY_API_READ_TOKEN;

export async function loadQuery<QueryResponse>({ query, params }: { query: string; params?: QueryParams }) {
  const visualEditingEnabled = isVisualEditing();
  if (visualEditingEnabled && !token) {
    throw new Error('SANITY_API_READ_TOKEN ontbreekt: nodig voor Visual Editing.');
  }

  const key = `${visualEditingEnabled ? 'drafts' : 'published'}:${query}:${JSON.stringify(params ?? {})}`;
  const cache = requestCache();
  const hit = cache?.get(key);
  if (hit) return hit as Promise<{ data: QueryResponse; perspective: string }>;

  const perspective = visualEditingEnabled ? 'drafts' : 'published';
  const promise = sanityClient
    .fetch<QueryResponse>(query, params ?? {}, {
      filterResponse: false,
      perspective,
      resultSourceMap: visualEditingEnabled ? 'withKeyArraySelector' : false,
      stega: visualEditingEnabled,
      ...(visualEditingEnabled ? { token } : {}),
    })
    .then(({ result }) => ({ data: result, perspective }));

  cache?.set(key, promise);
  return promise;
}
