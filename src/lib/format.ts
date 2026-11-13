import { settings } from '../settings';

const tz = settings.timeZone;

/** 30.07.2026 — zoals op de poster. */
export function formatDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: tz }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}`;
}

/** Thursday 30 July 2026 — voluit, voor schermlezers en eventpagina's. */
export function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(date);
}

/** 18:30 */
export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(date);
}

/** 1h 32m / 48m */
export function formatDuration(seconds?: number) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** ISO 8601-duur voor JSON-LD en <time datetime>: PT1H32M */
export function isoDuration(seconds?: number) {
  if (!seconds) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `PT${h ? `${h}H` : ''}${m}M`;
}

/** "A, B & C" */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
}
