// Koppelt documenten aan URL's voor de Presentation tool (_standards/SANITY.md §3 stap 9).
import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

const home = { title: 'Home', href: '/' };

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/sets/:slug', filter: `_type == "set" && slug.current == $slug` },
    { route: '/djs/:slug', filter: `_type == "dj" && slug.current == $slug` },
    { route: '/genres/:slug', filter: `_type == "genre" && slug.current == $slug` },
    { route: '/about', filter: `_type == "page" && slug.current == "about"` },
  ]),
  locations: {
    set: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || 'Set', href: `/sets/${doc?.slug}` }, { title: 'Sets', href: '/sets' }, home],
      }),
    }),
    dj: defineLocations({
      select: { title: 'name', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || 'DJ', href: `/djs/${doc?.slug}` }, { title: "DJ's", href: '/djs' }],
      }),
    }),
    genre: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || 'Genre', href: `/genres/${doc?.slug}` }, { title: 'Genres', href: '/genres' }],
      }),
    }),
    page: defineLocations({
      select: { slug: 'slug.current' },
      resolve: (doc) => ({ locations: [{ title: doc?.slug ?? 'Pagina', href: `/${doc?.slug}` }] }),
    }),
    siteSettings: defineLocations({
      message: 'Staat op elke pagina (header, footer, meta).',
      tone: 'positive',
      locations: [home],
    }),
  },
};
