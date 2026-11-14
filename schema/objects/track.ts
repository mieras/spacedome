import { PlayIcon } from '@sanity/icons/Play';
import { defineField, defineType } from 'sanity';

export const track = defineType({
  name: 'track',
  title: 'Track',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({ name: 'artist', title: 'Artiest', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'title', title: 'Titel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'label', type: 'string' }),
    defineField({
      name: 'time',
      title: 'Tijd in de set',
      type: 'string',
      description: 'mm:ss of h:mm:ss, bijv. 12:34. Optioneel.',
      validation: (r) => r.regex(/^\d{1,2}(:\d{2}){1,2}$/, { name: 'tijd' }),
    }),
  ],
  preview: {
    select: { artist: 'artist', title: 'title', time: 'time' },
    prepare: ({ artist, title, time }) => ({ title: `${artist} – ${title}`, subtitle: time }),
  },
});
