/// <reference types="astro/client" />

/** Netlify-context van deze build (astro.config.mjs → vite.define). */
declare const __DEPLOY_CONTEXT__: string;

interface ImportMetaEnv {
  /** Optioneel: forceer de status (live, comingSoon, maintenance), los van Sanity. */
  readonly SITE_STATUS?: string;
}

declare namespace App {
  interface Locals {
    /** Visual Editing aan voor dit verzoek (geldige preview-cookie én in de iframe van de Studio). */
    visualEditing: boolean;
  }
}
