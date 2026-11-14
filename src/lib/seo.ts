// Titel, beschrijving en JSON-LD. Zie ~/Code/_standards/SEO.md.
import { settings, type Settings } from '../settings';

export function pageTitle(title: string, isHome = false, s: Settings = settings) {
  if (isHome) return `${s.siteName} — ${s.tagline}`;
  return s.titleTemplate.replace('%s', title);
}

export function pageDescription(fallback?: string, s: Settings = settings) {
  const clean = (fallback || s.description).replace(/\s+/g, ' ').trim();
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
}

export function entityJsonLd(site: URL, s: Settings = settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': new URL('/#entity', site).href,
    name: s.siteName,
    url: site.href,
    description: s.tagline,
    sameAs: s.socials.map((x) => x.url),
  };
}

export function websiteJsonLd(site: URL, s: Settings = settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': new URL('/#website', site).href,
    url: site.href,
    name: s.siteName,
    inLanguage: 'en',
    publisher: { '@id': new URL('/#entity', site).href },
  };
}
