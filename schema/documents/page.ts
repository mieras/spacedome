import { DocumentIcon } from '@sanity/icons/Document';
import { defineField, defineType } from 'sanity';
import { vereistInBasistaal } from '../i18n';

/** Vaste routes waar een pagina niet op mag staan. */
const gereserveerd = ['sets', 'djs', 'genres', 'admin', 'api', 'brand', '404', 'en', 'nl', 'robots.txt', 'llms.txt', 'sitemap-index.xml'];

export const page = defineType({
  name: 'page',
  title: 'Pagina',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({ name: 'title', title: 'Titel', type: 'internationalizedArrayString', validation: vereistInBasistaal }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: { source: (doc) => (doc.title as { language?: string; value?: string }[] | undefined)?.find((t) => t.language === 'en')?.value ?? '' },
      validation: (r) =>
        r.required().custom((slug) => (slug?.current && gereserveerd.includes(slug.current) ? `"${slug.current}" is een vaste route van de site.` : true)),
    }),
    defineField({
      name: 'description',
      title: 'Korte omschrijving',
      type: 'internationalizedArrayText',
      description: 'Eén of twee zinnen. Voor zoekmachines en als je een link deelt.',
    }),
    defineField({ name: 'body', title: 'Tekst', type: 'internationalizedArrayBlockContent' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({
      title: (title as { language?: string; value?: string }[] | undefined)?.find((t) => t.language === 'en')?.value ?? 'Pagina',
      subtitle: slug ? `/${slug}` : undefined,
    }),
  },
});
