// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // TODO: live-domein zodra dat gekozen is (spacedome.xyz is niet van ons, zie docs/mail-intake.md).
  site: 'https://spacedome.netlify.app',
  trailingSlash: 'never',
  build: { format: 'file' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // /brand is een interne stijlgids: niet in de sitemap (en noindex).
  integrations: [sitemap({ filter: (page) => !page.endsWith('/brand') })],
  vite: {
    css: {
      preprocessorOptions: {
        // Zodat `@use 'utopia-core-scss/src/utopia'` uit node_modules werkt.
        scss: { loadPaths: ['node_modules'] },
      },
    },
  },
});
