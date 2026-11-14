import { CogIcon } from '@sanity/icons/Cog';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { vereistInBasistaal } from '../i18n';

/**
 * Site-instellingen (singleton, ID `siteSettings`). Ingekorte versie van _standards/SANITY.md §1:
 * menu en footer komen voorlopig uit de code, organisatie/statistiek volgen bij livegang.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site-instellingen',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'algemeen', title: 'Algemeen', default: true },
    { name: 'social', title: 'Socials' },
    { name: 'seo', title: 'SEO' },
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
  ],
  preview: { prepare: () => ({ title: 'Site-instellingen' }) },
});
