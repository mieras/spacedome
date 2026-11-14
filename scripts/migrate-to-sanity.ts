/*
 * Markdown (src/content) → Sanity. Volgens _standards/SANITY-MIGRATIE.md §3.
 *
 *   npm run sanity:migrate -- --dry-run   # valideren en tellen, niets schrijven
 *   npm run sanity:migrate                # alleen nieuwe documenten aanmaken (bestaande blijven staan)
 *   npm run sanity:migrate -- --force     # alles overschrijven met Markdown (wist wijzigingen uit de Studio!)
 *
 * Nodig in .env: SANITY_API_WRITE_TOKEN (Editor of hoger). Trek die token in als de migratie definitief is.
 * Vaste ID's (`set-<slug>`, `dj-<slug>`, …) en vaste _key's, zodat een tweede run niets verandert.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { markdownToPortableText } from '@portabletext/markdown';
import { parse } from 'yaml';
import { settings } from '../src/settings.ts';

const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'src/content');
const TAAL = 'en'; // alle bestaande content is Engels

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || '6fcexd1b';
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!DRY && !token) throw new Error('SANITY_API_WRITE_TOKEN ontbreekt in .env');

type Md = { slug: string; data: Record<string, any>; body: string };
type Doc = { _id: string; _type: string; [k: string]: unknown };

async function readCollection(name: string): Promise<Md[]> {
  const dir = path.join(CONTENT, name);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(dir, file), 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!m) throw new Error(`Geen frontmatter in ${name}/${file}`);
      return { slug: file.replace(/\.md$/, ''), data: parse(m[1]) ?? {}, body: m[2] };
    }),
  );
}

/* ---------- Helpers ---------- */

const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 12);

/** Lege waarden weglaten: in Sanity is "leeg" afwezig. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)),
  ) as T;
}

/** Markdown → Portable Text met vaste _key's (afgeleid van de plek), zodat opnieuw draaien niets verandert. */
function toBlocks(markdown: string, prefix: string) {
  const clean = markdown.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!clean) return undefined;
  const blocks = markdownToPortableText(clean) as any[];
  return blocks.map((block, i) => {
    const bKey = hash(`${prefix}:${i}`);
    const markMap = new Map<string, string>();
    const markDefs = (block.markDefs ?? []).map((def: any, j: number) => {
      const key = hash(`${prefix}:${i}:m${j}`);
      markMap.set(def._key, key);
      return { ...def, _key: key };
    });
    const children = (block.children ?? []).map((child: any, j: number) => ({
      ...child,
      _key: hash(`${prefix}:${i}:c${j}`),
      marks: (child.marks ?? []).map((mark: string) => markMap.get(mark) ?? mark),
    }));
    return { ...block, _key: bKey, markDefs, children };
  });
}

/** Eén taal in een internationalizedArray-veld (plugin v5: taal in `language`). */
function i18n(type: 'String' | 'Text' | 'SimpleBlockContent' | 'BlockContent', value: unknown) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return undefined;
  return [{ _key: TAAL, _type: `internationalizedArray${type}Value`, language: TAAL, value }];
}

const ref = (id: string, key: string) => ({ _type: 'reference', _ref: id, _key: key });
const slug = (current: string) => ({ _type: 'slug', current });

/* ---------- Omzetten ---------- */

const warnings: string[] = [];
const docs: Doc[] = [];

const [genres, djs, sets, pages] = await Promise.all(['genres', 'djs', 'sets', 'pages'].map(readCollection));
const genreIds = new Set(genres.map((g) => g.slug));
const djIds = new Set(djs.map((d) => d.slug));

for (const g of genres) {
  docs.push(
    compact({
      _id: `genre-${g.slug}`,
      _type: 'genre',
      title: g.data.title,
      slug: slug(g.slug),
      description: i18n('Text', g.data.description),
    }),
  );
}

for (const d of djs) {
  if (d.data.photo) warnings.push(`dj ${d.slug}: foto overgeslagen (lokale beelden nog niet ondersteund)`);
  docs.push(
    compact({
      _id: `dj-${d.slug}`,
      _type: 'dj',
      name: d.data.name,
      slug: slug(d.slug),
      location: d.data.location,
      resident: d.data.resident ?? false,
      links: (d.data.links ?? []).map((l: { label: string; url: string }, i: number) => ({
        _key: hash(`dj-${d.slug}:link:${i}`),
        _type: 'link',
        label: l.label,
        url: l.url,
      })),
      bio: i18n('SimpleBlockContent', toBlocks(d.body, `dj-${d.slug}:bio`)),
    }),
  );
}

for (const s of sets) {
  const id = `set-${s.slug}`;
  const refsTo = (list: string[] = [], known: Set<string>, type: string) =>
    list.flatMap((r, i) => {
      if (!known.has(r)) {
        warnings.push(`${id}: ${type} "${r}" bestaat niet, weggelaten`);
        return [];
      }
      return [ref(`${type}-${r}`, hash(`${id}:${type}:${i}`))];
    });
  if (s.data.poster) warnings.push(`${id}: eigen poster overgeslagen (lokale beelden nog niet ondersteund)`);
  if (s.data.draft) warnings.push(`${id}: stond op draft in Markdown, komt in Sanity als gepubliceerd document`);
  const date = s.data.date instanceof Date ? s.data.date.toISOString().slice(0, 10) : String(s.data.date);
  docs.push(
    compact({
      _id: id,
      _type: 'set',
      title: String(s.data.title),
      slug: slug(s.slug),
      date,
      djs: refsTo(s.data.djs, djIds, 'dj'),
      genres: refsTo(s.data.genres, genreIds, 'genre'),
      description: i18n('SimpleBlockContent', toBlocks(s.body, `${id}:description`)),
      featured: s.data.featured ?? false,
      video: compact({ _type: 'video', ...s.data.video }),
      posterTime: s.data.posterTime,
      tracklist: (s.data.tracklist ?? []).map((t: Record<string, string>, i: number) =>
        compact({ _key: hash(`${id}:track:${i}`), _type: 'track', artist: t.artist, title: t.title, label: t.label, time: t.time }),
      ),
    }),
  );
}

for (const p of pages) {
  docs.push(
    compact({
      _id: `page-${p.slug}`,
      _type: 'page',
      title: i18n('String', p.data.title),
      slug: slug(p.slug),
      description: i18n('Text', p.data.description),
      body: i18n('BlockContent', toBlocks(p.body, `page-${p.slug}:body`)),
    }),
  );
}

docs.push(
  compact({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: settings.siteName,
    tagline: i18n('String', settings.tagline),
    description: i18n('Text', settings.description),
    socials: settings.socials.map((s, i) => ({ _key: hash(`socials:${i}`), _type: 'social', label: s.label, handle: s.handle, url: s.url })),
    noindex: settings.noindex,
  }),
);

/* ---------- Schrijven ---------- */

const count = docs.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d._type]: (acc[d._type] ?? 0) + 1 }), {});
console.log(`${DRY ? '[dry-run] ' : ''}${docs.length} documenten:`, count);
for (const w of warnings) console.warn(`  ! ${w}`);

if (DRY) {
  console.log(JSON.stringify(docs.find((d) => d._type === 'set'), null, 2));
} else {
  const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false });
  const tx = client.transaction();
  // Sanity is nu de bron: standaard alleen ontbrekende documenten aanmaken.
  for (const doc of docs) (FORCE ? tx.createOrReplace(doc) : tx.createIfNotExists(doc));
  const res = await tx.commit({ visibility: 'sync' });
  const written = res.results.filter((r) => r.operation !== 'none').length;
  console.log(`Klaar (${FORCE ? 'overschreven' : 'alleen nieuw'}): ${written} van ${docs.length} documenten geschreven naar ${projectId}/${dataset}.`);
}
