// Zie ~/Code/_standards/SEO.md §6. Samenvatting en index voor AI-assistenten.
import type { APIRoute } from 'astro';
import { djHref, eventHref, getLibrary, setHref } from '../lib/content';
import { formatDate, joinNames } from '../lib/format';
import { settings } from '../settings';

export const GET: APIRoute = async ({ site }) => {
  const lib = await getLibrary();
  const url = (path: string) => new URL(path, site).href;
  const body = [
    `# ${settings.siteName}`,
    '',
    `> ${settings.tagline}`,
    '',
    settings.description,
    '',
    '## Sets',
    '',
    ...lib.sets.map((s) => `- [${s.data.title}](${url(setHref(s.id))}): ${joinNames(lib.djsOf(s).map((d) => d.data.name))}, ${formatDate(s.data.date)}`),
    '',
    '## DJs',
    '',
    ...lib.djs.map((d) => `- [${d.data.name}](${url(djHref(d.id))})`),
    '',
    '## Events',
    '',
    ...lib.events.map((e) => `- [${e.data.title} @ ${e.data.venue.name}](${url(eventHref(e.id))}): ${formatDate(e.data.start)}, ${e.data.venue.city}`),
    '',
    '## About',
    '',
    `- [About](${url('/about')})`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
