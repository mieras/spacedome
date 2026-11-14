// Visual Editing staat per request aan, niet per build (_standards/SANITY.md §3).
// De cookie wordt gezet door /api/preview, dat alleen de Presentation tool in de Studio
// kan aanroepen (met een geldig preview-secret).
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const PREVIEW_COOKIE = 'sanity-preview';
export const PREVIEW_MAX_AGE = 60 * 60 * 12; // 12 uur, in seconden

type Store = {
  visualEditing: boolean;
  /** Querycache per request: header, footer en pagina vragen dezelfde data op. */
  cache: Map<string, Promise<unknown>>;
};

const storage = new AsyncLocalStorage<Store>();

export function runWithVisualEditing<T>(visualEditing: boolean, fn: () => T) {
  return storage.run({ visualEditing, cache: new Map() }, fn);
}

export function isVisualEditing() {
  return storage.getStore()?.visualEditing ?? false;
}

/**
 * Haalt alle stega-tekens weg, ook midden in een string. stegaClean() doet alleen het blok aan het eind,
 * dus niet genoeg voor samengestelde tekst ("<titel> by <dj>") in de <head>. Werkt ook op objecten (JSON-LD).
 */
const STEGA = /[\u200b-\u200d\u2060\ufeff]/g;
export function stripStega<T>(value: T): T {
  if (typeof value === 'string') return value.replace(STEGA, '') as T;
  return JSON.parse(JSON.stringify(value).replace(STEGA, '')) as T;
}

export function requestCache() {
  return storage.getStore()?.cache;
}

// De cookie-waarde is `<verloopt>.<handtekening>`, ondertekend met de server-only read token.
// Zonder token kan niemand een geldige cookie maken; `sanity-preview=true` werkt dus niet.
function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(`${PREVIEW_COOKIE}:${payload}`).digest('base64url');
}

export function createPreviewCookieValue(secret: string) {
  const expires = String(Date.now() + PREVIEW_MAX_AGE * 1000);
  return `${expires}.${sign(expires, secret)}`;
}

export function isValidPreviewCookie(value: string | undefined) {
  const secret = import.meta.env.SANITY_API_READ_TOKEN;
  if (!value || !secret) return false;

  const [expires, signature] = value.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;

  const expected = Buffer.from(sign(expires, secret));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
