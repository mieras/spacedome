#!/usr/bin/env node
/*
 * Set toevoegen: video uit STACK → Bunny Stream → Markdown-bestand in src/content/sets.
 * Tijdelijke vervanger van Sanity (zie README, "Set toevoegen").
 *
 *   npm run set:add                  kies een video uit de STACK-map READY
 *   npm run set:add -- --list        alleen laten zien wat er in STACK staat
 *   npm run set:add -- --folder Recordings
 *   npm run set:add -- --draft       set als draft (alleen zichtbaar in `npm run dev`)
 *   npm run set:add -- --no-wait     niet wachten tot Bunny klaar is met coderen
 *
 * Hoe het werkt:
 * - STACK geeft bestanden in een share pas vrij na een "handshake": POST op de share levert
 *   twee tijdelijke sleutels op (X-ShareToken en X-CSRF-Token), die als headers mee moeten.
 *   Een browser kan dat niet, Bunny wel: we geven Bunny de download-URL plus die headers en
 *   Bunny haalt het bestand zelf op (server naar server, niets via deze computer).
 * - Bunny codeert naar HLS (240p t/m 1080p); de site speelt <cdn>/<guid>/playlist.m3u8 af.
 * - Dit script doet bij STACK alleen lees-verzoeken (lijst en download). Nooit verwijderen of uploaden.
 *
 * Nodig in .env: STACK_SHARE_URL, BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_STREAM_CDN_HOSTNAME.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const CONTENT = join(ROOT, 'src/content');

/* ---------- Argumenten en env ---------- */

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const env = (name) => {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} ontbreekt in .env (zie .env.example).`);
  return value;
};

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/* ---------- STACK (alleen lezen) ---------- */

async function stackSession() {
  const share = new URL(env('STACK_SHARE_URL'));
  const id = share.pathname.split('/').filter(Boolean)[1]; // /s/<id>/...
  if (!id) fail('STACK_SHARE_URL heeft niet de vorm https://<naam>.stack.storage/s/<id>');
  const base = `${share.origin}/api/v2/share/${id}`;
  const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: process.env.STACK_SHARE_PASSWORD ?? '' }) });
  const headers = { 'X-ShareToken': res.headers.get('x-sharetoken'), 'X-CSRF-Token': res.headers.get('x-csrf-token') };
  if (!res.ok || !headers['X-ShareToken']) fail(`STACK-share niet bereikbaar (${res.status}). Klopt de link, of staat er een wachtwoord op?`);
  const get = async (path) => {
    const r = await fetch(`${base}${path}`, { headers });
    if (!r.ok) fail(`STACK gaf ${r.status} op ${path}`);
    return r.json();
  };
  return { base, headers, get };
}

async function listNodes(stack, parentId) {
  const nodes = [];
  for (let offset = 0; ; offset += 200) {
    const page = await stack.get(`/nodes?limit=200&offset=${offset}&orderBy=default&parentID=${parentId}&mediaType=all`);
    nodes.push(...page.nodes);
    if (nodes.length >= page.total || page.nodes.length === 0) return nodes;
  }
}

/** Zoek een map op naam (zonder hoofdlettergevoeligheid), breedte-eerst vanaf de root van de share. */
async function findFolder(stack, name) {
  const root = await stack.get('');
  if (root.name.toLowerCase() === name.toLowerCase()) return root;
  const queue = [root.id];
  while (queue.length) {
    for (const node of await listNodes(stack, queue.shift())) {
      if (!node.dir) continue;
      if (node.name.toLowerCase() === name.toLowerCase()) return node;
      queue.push(node.id);
    }
  }
  fail(`Map "${name}" niet gevonden in de STACK-share.`);
}

/* ---------- Bunny Stream ---------- */

const bunny = {
  get library() {
    return env('BUNNY_STREAM_LIBRARY_ID');
  },
  get host() {
    return env('BUNNY_STREAM_CDN_HOSTNAME').replace(/^https?:\/\//, '').replace(/\/$/, '');
  },
  async call(path, init = {}) {
    const res = await fetch(`https://video.bunnycdn.com/library/${this.library}${path}`, {
      ...init,
      headers: { AccessKey: env('BUNNY_STREAM_API_KEY'), accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    });
    const body = await res.text();
    if (!res.ok) fail(`Bunny gaf ${res.status}: ${body.slice(0, 200)}`);
    return body ? JSON.parse(body) : {};
  },
};

const BUNNY_STATUS = {
  0: 'in de wachtrij / ophalen uit STACK',
  1: 'geüpload',
  2: 'ophalen uit STACK',
  3: 'coderen',
  4: 'klaar',
  5: 'fout',
  6: 'ophalen mislukt',
  7: 'segmenteren',
  8: 'playlists klaar',
};

/* ---------- Bestaande content ---------- */

function readCollection(dir) {
  const path = join(CONTENT, dir);
  return readdirSync(path)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const text = readFileSync(join(path, file), 'utf8');
      const field = (key) => text.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
      return { slug: file.replace(/\.md$/, ''), text, field };
    });
}

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const yaml = (s) => JSON.stringify(s); // JSON-strings zijn geldige YAML

/** "Drvg Cvltvre Set Space Dome 03-26.mp4" → "Drvg Cvltvre" */
const titleFromFile = (name) =>
  name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\s*(set\s*)?space\s*dome.*$/i, '')
    .replace(/\s+set$/i, '')
    .trim() || name;

/** Datum uit "… 03-26" (maand-jaar) of uit de bestandsnaam van OBS ("2026-05-15 16-14-25"), anders STACK-datum. */
function dateFromFile(node) {
  const obs = node.name.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (obs) return `${obs[1]}-${obs[2]}-${obs[3]}`;
  const my = node.name.match(/\b(\d{2})-(\d{2})\b/);
  if (my && +my[1] >= 1 && +my[1] <= 12) return `20${my[2]}-${my[1]}-01`;
  return new Date(node.created * 1000).toISOString().slice(0, 10);
}

const toSeconds = (s) => {
  const parts = s.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
};
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

/* ---------- Main ---------- */

// Regels via een iterator lezen (niet rl.question): dan raken we bij gepipete invoer niets kwijt.
const rl = createInterface({ input, output, terminal: input.isTTY });
const lines = rl[Symbol.asyncIterator]();
const ask = async (question, fallback = '') => {
  output.write(fallback ? `${question} [${fallback}]: ` : `${question}: `);
  const { value = '' } = await lines.next();
  if (!input.isTTY) output.write(`${value}\n`);
  return value.trim() || fallback;
};

try {
  const stack = await stackSession();
  const folder = await findFolder(stack, option('folder', 'READY'));
  const videos = (await listNodes(stack, folder.id)).filter((n) => !n.dir && n.mime?.startsWith('video/'));
  if (!videos.length) fail(`Geen video's in de map "${folder.name}".`);

  const sets = readCollection('sets');
  const imported = new Map(sets.map((s) => [Number(s.field('stack')), s.slug]).filter(([id]) => id));

  console.log(`\nVideo's in STACK/${folder.name}:\n`);
  videos.forEach((v, i) => {
    const minutes = v.metadata?.durationMs ? `${Math.round(v.metadata.durationMs / 60000)} min` : '? min';
    const done = imported.has(v.id) ? `  ✓ staat al op de site (${imported.get(v.id)})` : '';
    console.log(`  ${String(i + 1).padStart(2)}. ${v.name}  (${(v.size / 1e9).toFixed(1)} GB, ${minutes}, ${v.metadata?.height ?? '?'}p)${done}`);
  });
  if (flag('list')) process.exit(0);

  const pick = Number(await ask('\nWelke video? (nummer)'));
  const node = videos[pick - 1];
  if (!node) fail('Onbekend nummer.');
  if (imported.has(node.id)) {
    const again = await ask(`Deze staat al op de site als "${imported.get(node.id)}". Toch opnieuw toevoegen? (j/n)`, 'n');
    if (!/^j/i.test(again)) process.exit(0);
  }

  /* Gegevens van de set */
  const djs = readCollection('djs').map((d) => ({ slug: d.slug, name: d.field('name') ?? d.slug }));
  const genres = readCollection('genres').map((g) => ({ slug: g.slug, title: g.field('title') ?? g.slug }));
  const events = readCollection('events').map((e) => ({ slug: e.slug, title: e.field('title') ?? e.slug, start: e.field('start') ?? '' }));

  const guess = titleFromFile(node.name);
  const title = await ask('Titel', guess);
  const date = await ask('Datum (jjjj-mm-dd)', dateFromFile(node));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Datum moet de vorm jjjj-mm-dd hebben.');

  console.log(`\nBekende dj's: ${djs.map((d) => d.name).join(', ')}`);
  const djInput = await ask("Dj('s), komma-gescheiden. Nieuwe namen worden aangemaakt", guess);
  console.log(`\nGenres: ${genres.map((g) => g.title).join(', ')}`);
  const genreInput = await ask('Genres, komma-gescheiden (leeg mag)');
  if (events.length) {
    console.log('\nAvonden:');
    events.forEach((e, i) => console.log(`  ${i + 1}. ${e.title} (${e.start.slice(0, 10)})`));
  }
  const eventPick = events.length ? await ask('Bij welke avond? (nummer, leeg = losse set)') : '';
  const event = eventPick ? events[Number(eventPick) - 1] : undefined;
  if (eventPick && !event) fail('Onbekende avond.');

  const durationSec = Math.round((node.metadata?.durationMs ?? 0) / 1000);
  const stillInput = await ask('Still voor de thumbnail op tijdstip (mm:ss)', durationSec ? mmss(Math.round(durationSec / 3)) : '0:30');
  const stillSec = toSeconds(stillInput);
  if (stillSec === null) fail('Tijdstip moet de vorm mm:ss hebben.');

  /* Dj's en genres koppelen of aanmaken */
  const created = [];
  const resolve = (inputList, known, label, dir, make) =>
    inputList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => {
        const hit = known.find((k) => k.slug === slugify(name) || k[label].toLowerCase() === name.toLowerCase());
        if (hit) return hit.slug;
        const slug = slugify(name);
        const file = join(CONTENT, dir, `${slug}.md`);
        if (!existsSync(file)) {
          writeFileSync(file, make(name));
          created.push(`src/content/${dir}/${slug}.md`);
          known.push({ slug, [label]: name });
        }
        return slug;
      });
  const djSlugs = resolve(djInput, djs, 'name', 'djs', (name) => `---\nname: ${yaml(name)}\nlinks: []\n---\n\nBio volgt.\n`);
  if (!djSlugs.length) fail('Minstens één dj nodig.');
  const genreSlugs = resolve(genreInput, genres, 'title', 'genres', (name) => `---\ntitle: ${yaml(name)}\n---\n`);

  let slug = slugify(title);
  if (existsSync(join(CONTENT, 'sets', `${slug}.md`))) slug = `${slug}-${date}`;
  const setFile = join(CONTENT, 'sets', `${slug}.md`);
  if (existsSync(setFile)) fail(`src/content/sets/${slug}.md bestaat al.`);

  /* Bunny laat het bestand zelf uit STACK ophalen */
  const downloadUrl = `${stack.base}/files/${node.id}/download/${encodeURIComponent(node.name)}?noContentDisposition=1`;
  const { id: guid } = await bunny.call(`/videos/fetch?thumbnailTime=${stillSec * 1000}`, {
    method: 'POST',
    body: JSON.stringify({ url: downloadUrl, title, headers: stack.headers }),
  });
  if (!guid) fail('Bunny gaf geen video-id terug.');

  const write = (thumbnailFile = 'thumbnail.jpg', duration = durationSec) => {
    const lines = [
      '---',
      `title: ${yaml(title)}`,
      `date: ${date}`,
      `djs: [${djSlugs.join(', ')}]`,
      `genres: [${genreSlugs.join(', ')}]`,
      event ? `event: ${event.slug}` : null,
      'video:',
      `  src: https://${bunny.host}/${guid}/playlist.m3u8`,
      duration ? `  duration: ${duration}` : null,
      `  bunny: ${guid}`,
      `  stack: ${node.id}`,
      `  thumbnail: https://${bunny.host}/${guid}/${thumbnailFile}`,
      `posterTime: ${stillSec}`,
      '# Tracklist: - { artist: …, title: …, label: …, time: "12:34" }',
      'tracklist: []',
      flag('draft') ? 'draft: true' : null,
      '---',
      '',
      'Beschrijving volgt.',
      '',
    ];
    writeFileSync(setFile, lines.filter((l) => l !== null).join('\n'));
  };
  write(); // direct wegschrijven: afbreken tijdens het wachten kost dan niets

  console.log(`\n✓ Bunny haalt de video op (id ${guid}).`);
  console.log(`✓ src/content/sets/${slug}.md aangemaakt.`);
  created.forEach((f) => console.log(`✓ ${f} aangemaakt (vul de details later aan).`));

  if (!flag('no-wait')) {
    console.log('\nWachten tot Bunny klaar is (Ctrl+C mag: het gaat bij Bunny gewoon door)…');
    for (;;) {
      const v = await bunny.call(`/videos/${guid}`);
      const label = BUNNY_STATUS[v.status] ?? `status ${v.status}`;
      output.write(`\r  ${label}${v.encodeProgress ? ` ${v.encodeProgress}%` : ''}${v.availableResolutions ? ` (${v.availableResolutions})` : ''}        `);
      if (v.status === 4) {
        write(v.thumbnailFileName || 'thumbnail.jpg', v.length || durationSec);
        console.log('\n✓ Klaar om af te spelen.');
        break;
      }
      if (v.status === 5 || v.status === 6) fail('Bunny kon de video niet verwerken. Kijk in het Bunny-dashboard bij de video.');
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  console.log(`
Nog doen:
  1. Tracklist en beschrijving aanvullen in src/content/sets/${slug}.md
  2. Bekijken: npm run dev → /sets/${slug}
  3. Committen op een branch en via staging live zetten (AGENTS.md)
`);
} finally {
  rl.close();
}
