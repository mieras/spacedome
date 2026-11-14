/*
 * Content collections (Markdown). Later één-op-één naar Sanity-documenttypes:
 * set, dj, genre en page. Referenties worden Sanity-references.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const md = (base: string) => glob({ pattern: '**/*.md', base: `./src/content/${base}` });

const link = z.object({ label: z.string(), url: z.url() });

const genres = defineCollection({
  loader: md('genres'),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const djs = defineCollection({
  loader: md('djs'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      location: z.string().optional(),
      resident: z.boolean().default(false),
      photo: image().optional(),
      photoAlt: z.string().optional(),
      links: z.array(link).default([]),
    }),
});

const sets = defineCollection({
  loader: md('sets'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      djs: z.array(reference('djs')).min(1),
      genres: z.array(reference('genres')).default([]),
      video: z.object({
        /** HLS (.m3u8) of MP4. Bunny Stream: https://<cdn-host>/<guid>/playlist.m3u8 */
        src: z.string(),
        /** In seconden; voor de weergave vóór de video geladen is. */
        duration: z.number().int().positive().optional(),
        /** Bunny Stream-video (guid). Gezet door `npm run set:add`. */
        bunny: z.string().optional(),
        /** Bestand in STACK waar de video vandaan komt (node-id). Voorkomt dubbel importeren. */
        stack: z.number().int().optional(),
        /** Still uit de video (Bunny-thumbnail). Gebruikt als er geen eigen poster is. */
        thumbnail: z.url().optional(),
      }),
      /** Still als cover. Straks gekozen in de Studio via posterTime (Bunny-thumbnail). */
      poster: image().optional(),
      posterAlt: z.string().optional(),
      posterTime: z.number().nonnegative().optional(),
      tracklist: z
        .array(
          z.object({
            artist: z.string(),
            title: z.string(),
            label: z.string().optional(),
            /** mm:ss of h:mm:ss. Optioneel; later klikbaar in de player. */
            time: z.string().regex(/^\d{1,2}(:\d{2}){1,2}$/).optional(),
          }),
        )
        .default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: md('pages'),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { genres, djs, sets, pages };
