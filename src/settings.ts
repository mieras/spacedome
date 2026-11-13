/*
 * Site-instellingen. Straks het `siteSettings`-document in Sanity (zie _standards/SANITY.md).
 */
export const settings = {
  siteName: 'Space Dome',
  /** TODO: placeholder, definitieve tekst komt van Space Dome. */
  tagline: 'DJ sets recorded live at Space Dome. Watch, listen, repeat.',
  description:
    'Watch and listen to DJ sets recorded live at Space Dome nights: beats, trip-hop, deep grooves and experimental rhythms.',
  titleTemplate: '%s · Space Dome',
  lang: 'en',
  locale: 'en_GB',
  timeZone: 'Europe/Amsterdam',
  /** TODO: op false zetten bij livegang. */
  noindex: true,
  allowAiTraining: true,
  socials: [{ label: 'Instagram', handle: '@spacedome.xyz', url: 'https://www.instagram.com/spacedome.xyz/' }],
};

export type Settings = typeof settings;
