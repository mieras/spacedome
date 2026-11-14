import { PlayIcon } from '@sanity/icons/Play';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const set = defineType({
  name: 'set',
  title: 'Set',
  type: 'document',
  icon: PlayIcon,
  groups: [
    { name: 'info', title: 'Info', default: true },
    { name: 'video', title: 'Video en beeld' },
    { name: 'tracklist', title: 'Tracklist' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Titel', type: 'string', group: 'info', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      group: 'info',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'date', title: 'Datum opname', type: 'date', group: 'info', validation: (r) => r.required() }),
    defineField({
      name: 'djs',
      title: "DJ's",
      type: 'array',
      group: 'info',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'dj' }] })],
      validation: (r) => r.required().min(1).unique(),
    }),
    defineField({
      name: 'genres',
      type: 'array',
      group: 'info',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'genre' }] })],
      validation: (r) => r.unique(),
    }),
    defineField({ name: 'description', title: 'Omschrijving', type: 'internationalizedArraySimpleBlockContent', group: 'info' }),
    defineField({
      name: 'featured',
      title: 'Uitgelicht op home',
      type: 'boolean',
      group: 'info',
      initialValue: false,
    }),
    defineField({ name: 'filmedBy', title: 'Gefilmd door', type: 'string', group: 'info', initialValue: 'Streamnerd' }),
    defineField({
      name: 'video',
      type: 'video',
      group: 'video',
      description: 'De opname zelf staat bij Bunny Stream; hier staat alleen waar de player hem vindt.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'poster',
      title: 'Eigen still',
      type: 'image',
      group: 'video',
      description: 'Optioneel. Gaat voor de still uit de video, en is het beeld bij delen (WhatsApp, socials). Liggend, minstens 1600 px breed. Zet met de hotspot het belangrijkste punt.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst',
          type: 'string',
          description: 'Wat er te zien is, voor wie het beeld niet ziet. Bijv. "Drvg Cvltvre achter de draaitafels in de dome".',
        }),
      ],
    }),
    defineField({
      name: 'posterTime',
      title: 'Moment voor de still (seconden)',
      type: 'number',
      group: 'video',
      readOnly: true,
      description: 'Waar in de video Bunny de still uit pakte bij het importeren (497 = 8:17). Alleen ter info: aanpassen verandert de still niet. Andere still nodig? Upload een eigen still.',
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'tracklist',
      type: 'array',
      group: 'tracklist',
      of: [defineArrayMember({ type: 'track' })],
    }),
  ],
  orderings: [
    { title: 'Nieuwste eerst', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
    { title: 'Titel', name: 'title', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', date: 'date', dj0: 'djs.0.name', dj1: 'djs.1.name', media: 'poster' },
    prepare: ({ title, date, dj0, dj1, media }) => ({
      title,
      subtitle: [[dj0, dj1].filter(Boolean).join(' & '), date].filter(Boolean).join(' · '),
      media: media ?? PlayIcon,
    }),
  },
});
