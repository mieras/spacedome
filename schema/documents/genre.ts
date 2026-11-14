import { TagIcon } from '@sanity/icons/Tag';
import { defineField, defineType } from 'sanity';

export const genre = defineType({
  name: 'genre',
  title: 'Genre',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', title: 'Naam', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', title: 'Omschrijving', type: 'internationalizedArrayText' }),
  ],
  orderings: [{ title: 'Naam', name: 'title', by: [{ field: 'title', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
});
