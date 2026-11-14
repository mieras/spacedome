import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { sanityClient } from 'sanity:client';

const builder = createImageUrlBuilder(sanityClient);

/** Beeld-URL uit de Sanity-CDN (gebruikt hotspot en crop). Formaat kiest de CDN zelf (auto=format). */
export const urlFor = (source: SanityImageSource) => builder.image(source).auto('format');
