/*
 * Datalaag. Pagina's halen content alleen via deze functies op, zodat de overstap naar
 * Sanity (loadQuery + GROQ) op één plek gebeurt.
 */
import { getImage } from 'astro:assets';
import { getCollection, type CollectionEntry } from 'astro:content';
import { artStyle } from './art';
import { joinNames } from './format';

export type SetEntry = CollectionEntry<'sets'>;
export type DjEntry = CollectionEntry<'djs'>;
export type GenreEntry = CollectionEntry<'genres'>;
export type EventEntry = CollectionEntry<'events'>;

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

const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }) => b.data.date.valueOf() - a.data.date.valueOf();

export async function getSets() {
  const sets = await getCollection('sets', ({ data }) => import.meta.env.DEV || !data.draft);
  return sets.sort(byDateDesc);
}

export async function getDjs() {
  return (await getCollection('djs')).sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function getGenres() {
  return (await getCollection('genres')).sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function getEvents() {
  return (await getCollection('events')).sort((a, b) => b.data.start.valueOf() - a.data.start.valueOf());
}

/** Alles in één keer, met snelle opzoektabellen. Collecties zijn klein (tientallen items). */
export async function getLibrary() {
  const [sets, djs, genres, events] = await Promise.all([getSets(), getDjs(), getGenres(), getEvents()]);
  const djMap = new Map(djs.map((d) => [d.id, d]));
  const genreMap = new Map(genres.map((g) => [g.id, g]));
  const eventMap = new Map(events.map((e) => [e.id, e]));

  const djsOf = (set: SetEntry) => set.data.djs.map((r) => djMap.get(r.id)).filter((d): d is DjEntry => !!d);
  const genresOf = (set: SetEntry) => set.data.genres.map((r) => genreMap.get(r.id)).filter((g): g is GenreEntry => !!g);
  const eventOf = (set: SetEntry) => (set.data.event ? eventMap.get(set.data.event.id) : undefined);

  return { sets, djs, genres, events, djMap, genreMap, eventMap, djsOf, genresOf, eventOf };
}

export type Library = Awaited<ReturnType<typeof getLibrary>>;

export const setHref = (id: string) => `/sets/${id}`;
export const djHref = (id: string) => `/djs/${id}`;
export const genreHref = (id: string) => `/genres/${id}`;
export const eventHref = (id: string) => `/events/${id}`;

/** Beeld van een set: eigen poster, anders de still uit de video (Bunny), anders niets (gegenereerde art). */
export const setStill = (set: SetEntry) => set.data.poster ?? set.data.video.thumbnail;

export async function toPlayerItem(set: SetEntry, lib: Library): Promise<PlayerItem> {
  const still = setStill(set);
  // Bunny-still: URL direct (de build mag hem niet ophalen, zie CoverArt). Eigen poster: verkleinen.
  const cover =
    typeof still === 'string' ? still : still ? (await getImage({ src: still, width: 256, height: 256, fit: 'cover', format: 'webp' })).src : undefined;
  return {
    id: set.id,
    title: set.data.title,
    href: setHref(set.id),
    artists: joinNames(lib.djsOf(set).map((d) => d.data.name)),
    src: set.data.video.src,
    duration: set.data.video.duration,
    art: artStyle(set.id),
    cover,
  };
}

/**
 * Suggesties: zelfde dj weegt het zwaarst, dan gedeelde genres, dan dezelfde avond.
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
      if (set.data.event && s.data.event?.id === set.data.event.id) score += 1;
      return { s, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || byDateDesc(a.s, b.s))
    .slice(0, limit)
    .map(({ s }) => s);
}

export const setsByDj = (lib: Library, djId: string) => lib.sets.filter((s) => s.data.djs.some((r) => r.id === djId));
export const setsByGenre = (lib: Library, genreId: string) => lib.sets.filter((s) => s.data.genres.some((r) => r.id === genreId));
export const setsByEvent = (lib: Library, eventId: string) => lib.sets.filter((s) => s.data.event?.id === eventId);

export const isUpcoming = (event: EventEntry, now = new Date()) => (event.data.end ?? event.data.start) >= now;
