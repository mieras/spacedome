/*
 * Gegenereerde cover-art: een vaste, unieke compositie per ID (zelfde seed = zelfde beeld).
 * Nacht-gradient, twee "lensflare"-bollen en een ring (de dome). Kleuren blijven binnen
 * de posterpalet: indigo → violet → magenta. Wordt gebruikt als er nog geen still is.
 */

/** Eenvoudige, stabiele hash (FNV-1a) → 32-bit getal. */
function hash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pseudo-random reeks uit een seed (mulberry32). */
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** CSS custom properties voor .art (zie CoverArt.astro en de player). */
export function artStyle(seed: string) {
  const r = random(hash(seed));
  const h1 = 300 + r() * 75; // violet → magenta/roze
  const h2 = 270 + r() * 60; // indigo → violet
  return [
    `--art-h1:${h1.toFixed(0)}`,
    `--art-h2:${h2.toFixed(0)}`,
    `--art-x1:${pct(0.15 + r() * 0.7)}`,
    `--art-y1:${pct(0.15 + r() * 0.5)}`,
    `--art-x2:${pct(0.1 + r() * 0.8)}`,
    `--art-y2:${pct(0.45 + r() * 0.45)}`,
    `--art-ring-x:${pct(0.2 + r() * 0.6)}`,
    `--art-ring-y:${pct(0.25 + r() * 0.5)}`,
    `--art-ring-s:${(28 + r() * 30).toFixed(0)}%`,
    `--art-angle:${(140 + r() * 60).toFixed(0)}deg`,
  ].join(';');
}

/** Initialen voor dj-avatars zonder foto. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
