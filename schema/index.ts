import { dj } from './documents/dj';
import { genre } from './documents/genre';
import { page } from './documents/page';
import { set } from './documents/set';
import { link } from './objects/link';
import { track } from './objects/track';
import { video } from './objects/video';
import { siteSettings } from './singletons/siteSettings';

export const schemaTypes = [set, dj, genre, page, siteSettings, video, track, link];

/** Singletons: vaste ID, niet te verwijderen of te dupliceren (_standards/SANITY.md §0). */
export const singletonIds = new Set(['siteSettings']);
export const singletonTypes = new Set(['siteSettings']);
