/*
 * Sanity Studio, ingebouwd op /admin (via @sanity/astro). Zie _standards/SANITY.md.
 */
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { internationalizedArray } from 'sanity-plugin-internationalized-array';
import { structureTool } from 'sanity/structure';
import { schemaTypes, singletonIds, singletonTypes } from './schema/index';
import { blockContent, simpleBlockContent } from './schema/objects/blockContent';
import { structure } from './schema/structure';
import { standaardTaal, talen } from './src/lib/talen';

// Vite (Studio in Astro) kent import.meta.env; de Sanity CLI (typegen) niet: daarom de vaste terugval.
const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
export const projectId = env.PUBLIC_SANITY_PROJECT_ID || '6fcexd1b';
export const dataset = env.PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'spacedome',
  title: 'Space Dome',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    internationalizedArray({
      languages: talen,
      defaultLanguages: [standaardTaal],
      fieldTypes: ['string', 'text', simpleBlockContent, blockContent],
      languageDisplay: 'titleOnly',
      buttonLocations: ['field'],
    }),
    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (input, ctx) =>
      singletonIds.has(ctx.documentId ?? '')
        ? input.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : input,
  },
});
