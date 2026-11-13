/*
 * Site-instellingen. Straks het `siteSettings`-document in Sanity (zie _standards/SANITY.md).
 */
export const settings = {
  siteName: 'Space Dome',
  tagline: 'Low-end theory from the LA beat scene. Recorded live, on repeat.',
  description:
    'Space Dome brings the bass of the West Coast beat scene to the Netherlands: beats, trip-hop, deep grooves and experimental rhythms. Watch and listen to DJ sets recorded at our nights.',
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
