// Eigen sitemap: @astrojs/sitemap ziet server-routes niet (_standards/SANITY-MIGRATIE.md §5).
import type { APIRoute } from 'astro';
import { djHref, genreHref, getLibrary, getPageSlugs, getSettings, setHref } from '../lib/content';

const PAGE_ROUTES = new Set(['about']);

export const GET: APIRoute = async ({ site }) => {
  const [lib, pages, settings] = await Promise.all([getLibrary(), getPageSlugs(), getSettings()]);
  const paths = settings.noindex
    ? []
    : [
        '/',
        '/sets',
        '/djs',
        '/genres',
        // Alleen pagina's met een route (nu alleen about).
        ...pages.filter((p) => PAGE_ROUTES.has(p.id)).map((p) => `/${p.id}`),
        ...lib.sets.map((s) => setHref(s.id)),
        ...lib.djs.map((d) => djHref(d.id)),
        ...lib.genres.map((g) => genreHref(g.id)),
      ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
