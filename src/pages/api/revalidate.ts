/*
 * Leegt de Netlify-CDN na een publicatie in Sanity (_standards/SANITY.md §6).
 * Aangeroepen door een GROQ-webhook (create/update/delete, zonder drafts), ondertekend met SANITY_WEBHOOK_SECRET.
 */
import { purgeCache } from '@netlify/cache';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import type { APIRoute } from 'astro';
import { CACHE_TAG } from '../../lib/sanity/cache';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.SANITY_WEBHOOK_SECRET;
  if (!secret) return new Response('SANITY_WEBHOOK_SECRET ontbreekt', { status: 500 });

  const body = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';
  if (!(await isValidSignature(body, signature, secret))) {
    return new Response('Ongeldige handtekening', { status: 401 });
  }

  // Lokaal (netlify dev of astro dev) is er geen CDN om te legen.
  if (import.meta.env.DEV) return Response.json({ purged: [], dev: true });

  await purgeCache({ tags: [CACHE_TAG] });
  return Response.json({ purged: [CACHE_TAG] });
};
