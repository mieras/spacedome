// Zie ~/Code/_standards/SEO.md §5. Zoek- en ophaalbots altijd toegestaan; training via settings.
import type { APIRoute } from 'astro';
import { settings } from '../settings';

// Geen content: mag vast in de build.
export const prerender = true;

const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent'];

export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /'];
  if (!settings.allowAiTraining) for (const bot of TRAINING_BOTS) lines.push('', `User-agent: ${bot}`, 'Disallow: /');
  lines.push('', `Sitemap: ${new URL('/sitemap-index.xml', site).href}`);
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
