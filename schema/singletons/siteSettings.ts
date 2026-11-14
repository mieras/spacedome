import { CogIcon } from '@sanity/icons/Cog';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { vereistInBasistaal } from '../i18n';

/**
 * Site-instellingen (singleton, ID `siteSettings`). Ingekorte versie van _standards/SANITY.md §1:
 * menu en footer komen voorlopig uit de code, organisatie/statistiek volgen bij livegang.
 */
const STATUS_OPTIONS = [
  { title: 'Live', value: 'live' },
  { title: 'Coming soon', value: 'comingSoon' },
  { title: 'Onderhoud', value: 'maintenance' },
];

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site-instellingen',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'algemeen', title: 'Algemeen', default: true },
    { name: 'social', title: 'Socials' },
    { name: 'seo', title: 'SEO' },
    { name: 'status', title: 'Status' },
  ],
  fields: [
    defineField({ name: 'siteName', title: 'Sitenaam', type: 'string', group: 'algemeen', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Payoff', type: 'internationalizedArrayString', group: 'algemeen', validation: vereistInBasistaal }),
    defineField({
      name: 'description',
      title: 'Omschrijving',
      type: 'internationalizedArrayText',
      group: 'seo',
      description: 'Standaard-omschrijving voor zoekmachines en bij delen.',
      validation: vereistInBasistaal,
    }),
    defineField({
      name: 'socials',
      type: 'array',
      group: 'social',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'social',
          fields: [
            defineField({ name: 'label', title: 'Platform', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'handle', title: 'Naam op het platform', type: 'string', description: 'Bijv. @spacedome' }),
            defineField({ name: 'url', title: 'URL', type: 'url', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'handle' } },
        }),
      ],
    }),
    defineField({
      name: 'noindex',
      title: 'Verbergen voor zoekmachines',
      type: 'boolean',
      group: 'seo',
      description: 'Aan tot de livegang.',
      initialValue: true,
    }),
    defineField({
      name: 'status',
      title: 'Status live site',
      type: 'string',
      group: 'status',
      description: 'De echte site (main). Coming soon of Onderhoud: bezoekers zien alleen de statuspagina. Wie de Preview in de Studio opent, ziet de hele site nog 12 uur.',
      options: { list: STATUS_OPTIONS, layout: 'radio' },
      initialValue: 'comingSoon',
    }),
    defineField({
      name: 'statusStaging',
      title: 'Status staging en previews',
      type: 'string',
      group: 'status',
      description: 'Testversies (staging en deploy previews). Om de statuspagina uit te proberen zonder de live site te raken.',
      options: { list: STATUS_OPTIONS, layout: 'radio' },
      initialValue: 'live',
    }),
    defineField({
      name: 'statusTitle',
      title: 'Titel statuspagina',
      type: 'internationalizedArrayString',
      group: 'status',
      description: 'Leeg = "Coming soon" of "Back soon".',
    }),
    defineField({
      name: 'statusText',
      title: 'Tekst statuspagina',
      type: 'internationalizedArrayText',
      group: 'status',
      description: 'Eén of twee zinnen onder de titel. Leeg = de payoff (coming soon) of een standaardtekst (onderhoud).',
    }),
    defineField({
      name: 'countdown',
      title: 'Aftellen tot',
      type: 'datetime',
      group: 'status',
      description: 'Optioneel. Toont een countdown op de statuspagina. Bij nul staat er "Any moment now"; de site gaat pas live als je de status op Live zet.',
      options: { timeStep: 15 },
    }),
  ],
  preview: { prepare: () => ({ title: 'Site-instellingen' }) },
});
