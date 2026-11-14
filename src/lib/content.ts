/*
 * Datalaag. Pagina's halen content alleen via deze functies op. Bron: Sanity, via loadQuery()
 * (drafts in de Presentation tool, anders gepubliceerd). De vorm is gelijk aan die van de
 * oude Markdown-collecties ({ id, data, body }), zodat componenten niet hoefden te veranderen.
 */
import { stegaClean } from '@sanity/client/stega';
import type { PortableTextBlock } from '@portabletext/types';
import type { DJS_QUERY_RESULT, GENRES_QUERY_RESULT, PAGE_QUERY_RESULT, SETS_QUERY_RESULT, SETTINGS_QUERY_RESULT } from '../../sanity.types';
import { settings as defaults } from '../settings';
import { artStyle } from './art';
import { joinNames } from './format';
import { urlFor } from './sanity/image';
import { loadQuery } from './sanity/load-query';
import { stripStega } from './sanity/visual-editing';
import { DJS_QUERY, GENRES_QUERY, PAGE_QUERY, PAGES_QUERY, SETS_QUERY, SETTINGS_QUERY } from './sanity/queries';
import { standaardTaal } from './talen';

/* ---------- Normaliseren ---------- */

/**
 * Strings die op het scherm komen houden hun stega-tekens (klikbare overlays in de Presentation tool).
 * Al het andere (slugs, URL's, datums, getallen, keuzes) wordt schoongemaakt, anders breken links en logica.
 */
const SHOWN = new Set(['title', 'name', 'location', 'description', 'text', 'label', 'artist', 'siteName', 'tagline', 'alt']);

/** Type na normalize(): `null` wordt `undefined`. */
type Clean<T> = T extends null ? undefined : T extends (infer U)[] ? Clean<U>[] : T extends object ? { [K in keyof T]: Clean<T[K]> } : T;

/** GROQ geeft `null` voor lege velden; maak er `undefined` van en maak stega schoon buiten SHOWN. */
function normalize<T>(value: T, key = ''): Clean<T> {
  type R = Clean<T>;
  if (value === null) return undefined as R;
  if (Array.isArray(value)) return value.map((v) => normalize(v, key)).filter((v) => v !== undefined) as R;
  if (typeof value === 'string') return (SHOWN.has(key) ? value : stegaClean(value)) as R;
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => [k, normalize(v, k)])
        .filter(([, v]) => v !== undefined),
    ) as R;
  }
  return value as R;
}

type Img = NonNullable<SETS_QUERY_RESULT[number]['poster']>;
const hasAsset = (img?: Img | null): img is Img => !!img?.asset;

/* ---------- Types (vorm van de oude collecties) ---------- */

export type SetEntry = {
  id: string;
  _id: string;
  data: {
    title: string;
    date: Date;
    djs: { id: string }[];
    genres: { id: string }[];
    video: { src: string; duration?: number; bunny?: string; stack?: number; thumbnail?: string };
    /** Eigen still als URL uit de Sanity-CDN (1600 breed). */
    poster?: string;
    posterAlt?: string;
    posterSource?: Img;
    posterTime?: number;
    tracklist: { _key: string; artist: string; title: string; label?: string; time?: string }[];
    featured: boolean;
    filmedBy?: string;
  };
  /** Omschrijving als platte tekst (meta description, "heeft tekst?"). */
  body: string;
  /** Omschrijving als Portable Text. */
  content?: PortableTextBlock[];
};

export type DjEntry = {
  id: string;
  _id: string;
  data: {
    name: string;
    location?: string;
    resident: boolean;
    photo?: string;
    photoAlt?: string;
    links: { _key: string; label: string; url: string }[];
  };
  body: string;
  content?: PortableTextBlock[];
};

export type GenreEntry = { id: string; _id: string; data: { title: string; description?: string } };

export type PageEntry = { id: string; _id: string; data: { title: string; description?: string }; content?: PortableTextBlock[] };

/** Wat de player over een set moet weten. Gaat als JSON in data-item. */
export type PlayerItem = {
  id: string;
  title: string;
  href: string;
  artists: string;
  src: string;
  duration?: number;
  art: string;
  cover?: string;
};

const lang = standaardTaal; // straks per route (/en, /nl)

/* ---------- Ophalen ---------- */

export async function getSets(): Promise<SetEntry[]> {
  const { data } = await loadQuery<SETS_QUERY_RESULT>({ query: SETS_QUERY, params: { lang } });
  return (data ?? []).map((raw) => {
    const poster = raw.poster;
    const s = normalize({ ...raw, poster: undefined });
    return {
      id: s.id,
      _id: s._id,
      data: {
        title: s.title,
        date: new Date(s.date),
        djs: (s.djs ?? []).map((id) => ({ id })),
        genres: (s.genres ?? []).map((id) => ({ id })),
        video: s.video as SetEntry['data']['video'],
        poster: hasAsset(poster) ? urlFor(poster).width(1600).url() : undefined,
        posterAlt: poster?.alt ?? undefined,
        posterSource: hasAsset(poster) ? poster : undefined,
        posterTime: s.posterTime,
        tracklist: (s.tracklist ?? []) as SetEntry['data']['tracklist'],
        featured: s.featured ?? false,
        filmedBy: s.filmedBy,
      },
      body: s.text ?? '',
      content: (raw.content ?? undefined) as PortableTextBlock[] | undefined,
    };
  });
}

export async function getDjs(): Promise<DjEntry[]> {
  const { data } = await loadQuery<DJS_QUERY_RESULT>({ query: DJS_QUERY, params: { lang } });
  return (data ?? []).map((raw) => {
    const photo = raw.photo as Img | null;
    const d = normalize({ ...raw, photo: undefined });
    return {
      id: d.id,
      _id: d._id,
      data: {
        name: d.name,
        location: d.location,
        resident: d.resident ?? false,
        photo: hasAsset(photo) ? urlFor(photo).width(640).height(640).fit('crop').url() : undefined,
        photoAlt: photo?.alt ?? undefined,
        links: (d.links ?? []) as DjEntry['data']['links'],
      },
      body: d.text ?? '',
      content: (raw.content ?? undefined) as PortableTextBlock[] | undefined,
    };
  });
}

export async function getGenres(): Promise<GenreEntry[]> {
  const { data } = await loadQuery<GENRES_QUERY_RESULT>({ query: GENRES_QUERY, params: { lang } });
  return (data ?? []).map((raw) => {
    const g = normalize(raw);
    return { id: g.id, _id: g._id, data: { title: g.title, description: g.description } };
  });
}

export async function getPage(slug: string): Promise<PageEntry | undefined> {
  const { data } = await loadQuery<PAGE_QUERY_RESULT>({ query: PAGE_QUERY, params: { slug, lang } });
  if (!data) return undefined;
  const p = normalize({ ...data, content: undefined });
  return { id: p.id, _id: p._id, data: { title: p.title ?? '', description: p.description }, content: (data.content ?? undefined) as PortableTextBlock[] | undefined };
}

export async function getPageSlugs() {
  const { data } = await loadQuery<{ id: string; _updatedAt: string }[]>({ query: PAGES_QUERY });
  return (data ?? []).map((p) => normalize(p));
}

export type SiteSettings = typeof defaults;

/** Site-instellingen uit Sanity, met de vaste waarden uit src/settings.ts als terugval. */
export async function getSettings(): Promise<SiteSettings> {
  const { data } = await loadQuery<SETTINGS_QUERY_RESULT>({ query: SETTINGS_QUERY, params: { lang } });
  const s = normalize(data ?? {}) as Partial<NonNullable<SETTINGS_QUERY_RESULT>>;
  return {
    ...defaults,
    siteName: s.siteName ?? defaults.siteName,
    tagline: s.tagline ?? defaults.tagline,
    description: s.description ?? defaults.description,
    titleTemplate: `%s · ${stegaClean(s.siteName ?? defaults.siteName)}`,
    socials: s.socials?.length ? s.socials.map((x) => ({ label: x.label, handle: x.handle ?? '', url: x.url })) : defaults.socials,
    noindex: s.noindex ?? defaults.noindex,
  };
}

/** Alles in één keer, met snelle opzoektabellen. Collecties zijn klein (tientallen items). */
export async function getLibrary() {
  const [sets, djs, genres] = await Promise.all([getSets(), getDjs(), getGenres()]);
  const djMap = new Map(djs.map((d) => [d.id, d]));
  const genreMap = new Map(genres.map((g) => [g.id, g]));

  const djsOf = (set: SetEntry) => set.data.djs.map((r) => djMap.get(r.id)).filter((d): d is DjEntry => !!d);
  const genresOf = (set: SetEntry) => set.data.genres.map((r) => genreMap.get(r.id)).filter((g): g is GenreEntry => !!g);

  return { sets, djs, genres, djMap, genreMap, djsOf, genresOf };
}

export type Library = Awaited<ReturnType<typeof getLibrary>>;

export const setHref = (id: string) => `/sets/${id}`;
export const djHref = (id: string) => `/djs/${id}`;
export const genreHref = (id: string) => `/genres/${id}`;

/** Beeld van een set: eigen still, anders de still uit de video (Bunny), anders niets (gegenereerde art). */
export const setStill = (set: SetEntry) => set.data.poster ?? set.data.video.thumbnail;

/** Deelbeeld (OG) van een set: alleen een eigen still; Bunny weigert crawlers zonder Referer. */
export const setOgImage = (set: SetEntry) =>
  set.data.posterSource ? urlFor(set.data.posterSource).width(1200).height(630).fit('crop').format('jpg').url() : undefined;

export async function toPlayerItem(set: SetEntry, lib: Library): Promise<PlayerItem> {
  const cover = set.data.posterSource ? urlFor(set.data.posterSource).width(256).height(256).fit('crop').url() : set.data.video.thumbnail;
  return {
    id: set.id,
    title: stripStega(set.data.title),
    href: setHref(set.id),
    artists: stripStega(joinNames(lib.djsOf(set).map((d) => d.data.name))),
    src: set.data.video.src,
    duration: set.data.video.duration,
    art: artStyle(set.id),
    cover,
  };
}

const byDateDesc = (a: SetEntry, b: SetEntry) => b.data.date.valueOf() - a.data.date.valueOf();

/**
 * Suggesties: zelfde dj weegt het zwaarst, dan gedeelde genres.
 * Bij gelijke score de nieuwste eerst.
 */
export function suggestionsFor(set: SetEntry, lib: Library, limit = 4) {
  const djs = new Set(set.data.djs.map((r) => r.id));
  const genres = new Set(set.data.genres.map((r) => r.id));
  return lib.sets
    .filter((s) => s.id !== set.id)
    .map((s) => {
      let score = 0;
      for (const r of s.data.djs) if (djs.has(r.id)) score += 3;
      for (const r of s.data.genres) if (genres.has(r.id)) score += 1;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score || byDateDesc(a.s, b.s))
    .slice(0, limit)
    .map(({ s }) => s); // eerst verwant (zelfde dj, genre), daarna aangevuld met de nieuwste
}

export const setsByDj = (lib: Library, djId: string) => lib.sets.filter((s) => s.data.djs.some((r) => r.id === djId));
export const setsByGenre = (lib: Library, genreId: string) => lib.sets.filter((s) => s.data.genres.some((r) => r.id === genreId));
