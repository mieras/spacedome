// @ts-check
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  // TODO: live-domein zodra dat gekozen is (spacedome.xyz is niet van ons, zie docs/mail-intake.md).
  site: 'https://spacedome.netlify.app',
  trailingSlash: 'never',
  // Server-rendering op Netlify: content komt live uit Sanity, de CDN bewaart de pagina's (src/middleware.ts).
  output: 'server',
  adapter: netlify(),
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sanity({
      projectId: env.PUBLIC_SANITY_PROJECT_ID || '6fcexd1b',
      dataset: env.PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2025-01-01',
      // Altijd de API, niet de Sanity-CDN: na een purge moet de eerste render de nieuwe versie zien.
      // Bezoekers krijgen de pagina uit de Netlify-CDN, dus de API ziet weinig verzoeken.
      useCdn: false,
      studioBasePath: '/admin',
      stega: { studioUrl: '/admin' },
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
