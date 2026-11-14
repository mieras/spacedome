/*
 * GROQ-queries. Altijd via defineQuery met een unieke naam (TypeGen: `npm run typegen`).
 * Vertaalbare velden: plugin v5 bewaart de taal in `language`; terugval op Engels.
 */
import { defineQuery } from 'groq';

const img = (field: string) => `${field} { asset, crop, hotspot, alt }`;

export const SETS_QUERY = defineQuery(`*[_type == "set" && defined(slug.current)] | order(date desc) {
  _id,
  "id": slug.current,
  title,
  date,
  featured,
  filmedBy,
  posterTime,
  "djs": djs[]->slug.current,
  "genres": genres[]->slug.current,
  video { src, duration, bunny, stack, thumbnail },
  ${img('poster')},
  tracklist[] { _key, artist, title, label, time },
  "content": coalesce(description[language == $lang][0].value, description[language == "en"][0].value),
  "text": pt::text(coalesce(description[language == $lang][0].value, description[language == "en"][0].value))
}`);

export const DJS_QUERY = defineQuery(`*[_type == "dj" && defined(slug.current)] | order(name asc) {
  _id,
  "id": slug.current,
  name,
  location,
  resident,
  ${img('photo')},
  links[] { _key, label, url },
  "content": coalesce(bio[language == $lang][0].value, bio[language == "en"][0].value),
  "text": pt::text(coalesce(bio[language == $lang][0].value, bio[language == "en"][0].value))
}`);

export const GENRES_QUERY = defineQuery(`*[_type == "genre" && defined(slug.current)] | order(title asc) {
  _id,
  "id": slug.current,
  title,
  "description": coalesce(description[language == $lang][0].value, description[language == "en"][0].value)
}`);

export const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0] {
  _id,
  "id": slug.current,
  "title": coalesce(title[language == $lang][0].value, title[language == "en"][0].value),
  "description": coalesce(description[language == $lang][0].value, description[language == "en"][0].value),
  "content": coalesce(body[language == $lang][0].value, body[language == "en"][0].value)
}`);

export const PAGES_QUERY = defineQuery(`*[_type == "page" && defined(slug.current)] { "id": slug.current, _updatedAt }`);

export const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
  siteName,
  "tagline": coalesce(tagline[language == $lang][0].value, tagline[language == "en"][0].value),
  "description": coalesce(description[language == $lang][0].value, description[language == "en"][0].value),
  socials[] { _key, label, handle, url },
  noindex
}`);
