import { defineArrayMember, defineField } from 'sanity';

/*
 * Teksttypes voor de vertaalplugin. Ze gaan als definitie in `fieldTypes` van internationalizedArray
 * (sanity.config.ts), niet als losse schema-types: als alias-type kent de schemavalidatie ze niet.
 */

/** Korte tekst: alinea's, nadruk en links. Voor omschrijvingen en bio's. */
export const simpleBlockContent = defineField({
  name: 'simpleBlockContent',
  title: 'Tekst',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normaal', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Vet', value: 'strong' },
          { title: 'Cursief', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [{ name: 'href', title: 'URL', type: 'url', validation: (r) => r.required().uri({ scheme: ['http', 'https', 'mailto'] }) }],
          },
        ],
      },
    }),
  ],
});

/** Lopende tekst met tussenkoppen en lijsten. Voor pagina's (about). */
export const blockContent = defineField({
  name: 'blockContent',
  title: 'Tekst met koppen',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normaal', value: 'normal' },
        { title: 'Kop 2', value: 'h2' },
        { title: 'Kop 3', value: 'h3' },
      ],
      marks: {
        decorators: [
          { title: 'Vet', value: 'strong' },
          { title: 'Cursief', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [{ name: 'href', title: 'URL', type: 'url', validation: (r) => r.required().uri({ scheme: ['http', 'https', 'mailto'] }) }],
          },
        ],
      },
    }),
  ],
});
