import { VideoIcon } from '@sanity/icons/Video';
import { defineField, defineType } from 'sanity';

/**
 * Video van een set. De video zelf staat bij een streamingdienst (Bunny Stream), nooit in Sanity.
 * Velden worden gevuld door `npm run set:add`; met de hand alleen als je weet wat je doet.
 */
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'object',
  icon: VideoIcon,
  fieldsets: [
    {
      name: 'technisch',
      title: 'Technisch',
      description: 'Ingevuld bij het importeren. Niet aanpassen.',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: 'src',
      title: 'Stream-URL',
      type: 'url',
      description: 'Wat de player afspeelt. HLS (.m3u8) of MP4. Bunny: https://<cdn-host>/<guid>/playlist.m3u8',
      validation: (r) => r.required().uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'duration',
      title: 'Duur (seconden)',
      type: 'number',
      description: 'Lengte van de video, getoond op de kaart en de setpagina (bijv. 3600 = 1:00:00). Komt uit Bunny.',
      validation: (r) => r.integer().positive(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Still uit de video',
      type: 'url',
      description: 'Beeld dat Bunny uit de video haalde. De site gebruikt dit als er geen eigen still is.',
    }),
    defineField({
      name: 'bunny',
      title: 'Bunny-video (guid)',
      type: 'string',
      readOnly: true,
      fieldset: 'technisch',
      description: 'ID van de video bij Bunny Stream. Hiermee vind je hem terug in het Bunny-dashboard; later ook nodig voor beveiligde links.',
    }),
    defineField({
      name: 'stack',
      title: 'STACK-bestand (node-id)',
      type: 'number',
      readOnly: true,
      fieldset: 'technisch',
      description: 'ID van het originele bestand in STACK (map READY). Het importscript ziet hieraan welke opnames al op de site staan, zodat niets dubbel wordt geïmporteerd.',
    }),
  ],
});
