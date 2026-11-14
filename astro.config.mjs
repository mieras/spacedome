// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  // TODO: live-domein zodra dat gekozen is (spacedome.xyz is niet van ons, zie docs/mail-intake.md).
  site: 'https://spacedome.netlify.app',
  trailingSlash: 'never',
  build: { format: 'file' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // /brand is een interne stijlgids: niet in de sitemap (en noindex).
  integrations: [
    sitemap({ filter: (page) => !page.endsWith('/brand') && !page.includes('/admin') }),
    sanity({
      projectId: env.PUBLIC_SANITY_PROJECT_ID || '6fcexd1b',
      dataset: env.PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2025-01-01',
      // Gepubliceerde content via de CDN. Drafts (preview) komen later met een token, zie docs/plan.md.
      useCdn: true,
      // Studio op /admin. Statische build: hash-router (/admin#/…), geen adapter nodig.
      studioBasePath: '/admin',
    }),
    react(),
  ],
  vite: {
    css: {
      preprocessorOptions: {
        // Zodat `@use 'utopia-core-scss/src/utopia'` uit node_modules werkt.
        scss: { loadPaths: ['node_modules'] },
      },
    },
  },
});
