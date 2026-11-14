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
  fields: [
    defineField({
      name: 'src',
      title: 'Stream-URL',
      type: 'url',
      description: 'HLS (.m3u8) of MP4. Bunny: https://<cdn-host>/<guid>/playlist.m3u8',
      validation: (r) => r.required().uri({ scheme: ['https'] }),
    }),
    defineField({ name: 'duration', title: 'Duur (seconden)', type: 'number', validation: (r) => r.integer().positive() }),
    defineField({ name: 'bunny', title: 'Bunny-video (guid)', type: 'string', readOnly: true }),
    defineField({ name: 'stack', title: 'STACK-bestand (node-id)', type: 'number', readOnly: true }),
    defineField({ name: 'thumbnail', title: 'Still uit de video', type: 'url', description: 'Bunny-thumbnail. Gebruikt als er geen eigen poster is.' }),
  ],
});
