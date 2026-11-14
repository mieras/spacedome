import { UserIcon } from '@sanity/icons/User';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const dj = defineType({
  name: 'dj',
  title: 'DJ',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({ name: 'name', title: 'Naam', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: { source: 'name', maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'location', title: 'Plaats', type: 'string' }),
    defineField({ name: 'resident', title: 'Resident', type: 'boolean', initialValue: false }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt-tekst', type: 'string', description: 'Wat staat er op de foto? Leeg laten als het alleen de naam herhaalt.' }),
        defineField({ name: 'credit', title: 'Fotograaf', type: 'string' }),
      ],
    }),
    defineField({ name: 'links', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
    defineField({ name: 'bio', type: 'internationalizedArraySimpleBlockContent' }),
  ],
  orderings: [{ title: 'Naam', name: 'name', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', location: 'location', resident: 'resident', media: 'photo' },
    prepare: ({ title, location, resident, media }) => ({
      title,
      subtitle: [resident && 'Resident', location].filter(Boolean).join(' · '),
      media,
    }),
  },
});
