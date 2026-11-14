/*
 * Site-instellingen. Straks het `siteSettings`-document in Sanity (zie _standards/SANITY.md).
 */
export const settings = {
  siteName: 'Space Dome',
  /** TODO: placeholder, definitieve tekst en naam (Space Dome FM of Space Dome Radio) komen van Space Dome. */
  tagline: 'Radio shows and DJ sets from Space Dome. Watch, listen, repeat.',
  description:
    'Watch and listen to radio shows and DJ sets from Space Dome: beats, trip-hop, deep grooves and experimental rhythms.',
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
