/*
 * Per verzoek: Visual Editing aan of uit (_standards/SANITY.md §3) en CDN-cache (§6).
 *
 * Bezoekers krijgen HTML uit de Netlify-CDN. De cache blijft staan tot een publicatie in
 * Sanity hem leegt via /api/revalidate (tag `sanity`). Alles in één tag: header en footer
 * tonen genres en tellingen, dus vrijwel elke pagina hangt van alle content af.
 */
import type { APIContext, MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { CACHE_TAG } from './lib/sanity/cache';
import { PREVIEW_COOKIE, isValidPreviewCookie, runWithVisualEditing } from './lib/sanity/visual-editing';

// netlify.toml [[headers]] geldt niet voor function-responses: daarom hier ook.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await handle(context, next);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!response.headers.has(k)) response.headers.set(k, v);
  return response;
});

const handle = async (context: APIContext, next: MiddlewareNext): Promise<Response> => {
  const { pathname } = context.url;

  // Geprerenderd (robots.txt), de Studio en de API: geen preview of CDN-headers.
  if (context.isPrerendered || pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    context.locals.visualEditing = false;
    return next();
  }

  // De ondertekende cookie is de beveiliging; Sec-Fetch-Dest beperkt het tot de iframe van de Presentation tool.
  const hasPreviewCookie = isValidPreviewCookie(context.cookies.get(PREVIEW_COOKIE)?.value);
  const inIframe = context.request.headers.get('sec-fetch-dest') === 'iframe';
  const visualEditing = hasPreviewCookie && inIframe;
  context.locals.visualEditing = visualEditing;

  const response = await runWithVisualEditing(visualEditing, next);

  // Met preview-cookie nooit cachen: de inhoud verschilt per iframe/tab.
  if (hasPreviewCookie) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Vary', 'Cookie, Sec-Fetch-Dest');
    return response;
  }

  // Alleen geslaagde HTML in de CDN. Geprerenderde routes (robots.txt) lopen hier in productie niet langs.
  const isHtml = response.headers.get('content-type')?.includes('text/html');
  if (response.status === 200 && isHtml && !import.meta.env.DEV) {
    // Browser vraagt altijd na; de CDN bewaart tot de volgende purge.
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('Netlify-CDN-Cache-Control', 'public, durable, s-maxage=31536000, stale-while-revalidate=86400');
    response.headers.set('Netlify-Cache-Tag', CACHE_TAG);
    response.headers.set('Netlify-Vary', `cookie=${PREVIEW_COOKIE}`);
  }
  return response;
};
