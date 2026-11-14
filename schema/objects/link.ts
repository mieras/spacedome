import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({ name: 'label', title: 'Naam', type: 'string', description: 'Bijv. Instagram, SoundCloud', validation: (r) => r.required() }),
    defineField({ name: 'url', title: 'URL', type: 'url', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'label', subtitle: 'url' } },
});
