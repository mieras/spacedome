/**
 * Peak gradient: geometrie, paletten en de footer-instelling op één plek.
 * Gebruikt door PeakGradient.astro (bij de build), src/scripts/peak.ts (scrollen) en de
 * configurator op /brand, zodat preview en footer exact hetzelfde tekenen.
 *
 * Twee standen: `start` (de footer komt net in beeld) en de eindstand (helemaal onderaan). Tijdens
 * het scrollen mengen we elke waarde ertussen: de vorm zelf wordt heftiger, niets wordt geschaald.
 * De footer gebruikt PEAK_FOOTER. Aanpassen: speel op /brand#peak en plak het resultaat hier.
 */

export const PEAK_PALETTES = {
  // Indigo vloer, violet, magenta, zachtroze kern, poster-magenta, paars, weg.
  'pink': [
    [0, 'oklch(20% 0.08 290)'],
    [0.16, 'oklch(38% 0.19 298)'],
    [0.34, 'oklch(60% 0.25 335)'],
    [0.5, 'oklch(82% 0.12 350)'],
    [0.66, 'oklch(68% 0.23 352)'],
    [0.84, 'oklch(48% 0.22 315)'],
    [1, 'oklch(48% 0.22 315 / 0)'],
  ],
  // Warmer: magenta naar oranje en een zachtgele kern.
  'sunset': [
    [0, 'oklch(20% 0.08 290)'],
    [0.16, 'oklch(40% 0.2 305)'],
    [0.34, 'oklch(62% 0.25 350)'],
    [0.5, 'oklch(74% 0.18 45)'],
    [0.64, 'oklch(88% 0.11 85)'],
    [0.82, 'oklch(66% 0.24 352)'],
    [1, 'oklch(66% 0.24 352 / 0)'],
  ],
  // Rustig: alleen violet naar poster-magenta.
  'magenta': [
    [0, 'oklch(20% 0.08 290)'],
    [0.3, 'oklch(42% 0.21 305)'],
    [0.6, 'oklch(66% 0.24 352)'],
    [1, 'oklch(66% 0.24 352 / 0)'],
  ],
  // De volle regenboog, zoals het origineel (design.how / Dia).
  'rainbow': [
    [0, 'oklch(22% 0.09 290)'],
    [0.14, 'oklch(52% 0.2 268)'],
    [0.3, 'oklch(93% 0.035 285)'],
    [0.44, 'oklch(90% 0.16 95)'],
    [0.58, 'oklch(68% 0.22 38)'],
    [0.76, 'oklch(62% 0.25 352)'],
    [1, 'oklch(62% 0.25 352 / 0)'],
  ],
} satisfies Record<string, [number, string][]>;

export type PeakPalette = keyof typeof PEAK_PALETTES;

/** De vorm: alles wat tijdens het scrollen meeschuift. */
export type PeakShape = {
  /** Blur in viewBox-eenheden (box is 1271 × 599). */
  blur: number;
  /** Hoogte van de middelste kolom, als deel van de box. */
  peak: number;
  /** Hoogte van de buitenste kolommen, als deel van de middelste. */
  valley: number;
  /** Hoe de hoogte vanuit het midden afvalt: 0 = vlak, 1 = recht (piramide), hoger = boller. */
  power: number;
  /** Hoeveel de kolommen overlappen (1 = naad aan naad). */
  overlap: number;
  /** Dekking van het geheel. */
  opacity: number;
  /** Hoe ver het geheel omlaag zakt, als deel van de hoogte (0 = op de vloer). */
  drop: number;
};

export type PeakOptions = PeakShape & {
  /** Aantal kolommen (vast, schuift niet mee). */
  bars: number;
  palette: PeakPalette;
  /** Stand als de footer net in beeld komt. */
  start: PeakShape;
};

/** De footer. Eindstand = helemaal onderaan. */
export const PEAK_FOOTER: PeakOptions = {
  bars: 10,
  palette: 'magenta',
  blur: 35,
  peak: 0.84,
  valley: 0.76,
  power: 2.17,
  overlap: 2,
  opacity: 1,
  drop: 0,
  start: {
    blur: 20,
    peak: 0.58,
    valley: 0.14,
    power: 0,
    overlap: 1.4,
    opacity: 0.7,
    drop: 0.08,
  },
};

export const PEAK_W = 1271;
export const PEAK_H = 599;

export const SHAPE_KEYS = ['blur', 'peak', 'valley', 'power', 'overlap', 'opacity', 'drop'] as const;

/** Scrollcurve: ease-in-out, zodat het rustig begint en onderaan tot bloei komt. */
export const peakEase = (p: number) => {
  const x = Math.min(Math.max(p, 0), 1);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};

/** De vorm bij voortgang p (0 = start, 1 = eind), al met de curve erop. */
export function peakAt(o: PeakOptions, p: number): PeakShape {
  const e = peakEase(p);
  const shape = {} as PeakShape;
  for (const k of SHAPE_KEYS) shape[k] = o.start[k] + (o[k] - o.start[k]) * e;
  return shape;
}

/** Kolommen als {x, y, w, h}. */
function columns(bars: number, s: PeakShape) {
  const n = Math.max(1, Math.round(bars));
  const pitch = PEAK_W / n;
  const w = pitch * s.overlap;
  const mid = (n - 1) / 2;
  return Array.from({ length: n }, (_, i) => {
    const t = mid ? Math.abs(i - mid) / mid : 0;
    // power 0 → t^0 = 1 → alle kolommen op valley-hoogte: een vlakke band.
    const h = s.peak * PEAK_H * (s.valley + (1 - s.valley) * (1 - t ** s.power));
    // Onderkant doorgetrokken voorbij de box, zodat de blur onderaan niet lichter wordt.
    return { x: i * pitch - (w - pitch) / 2, y: PEAK_H - h + s.drop * PEAK_H, w, h: h + s.blur * 3 };
  });
}

/** De binnenkant van de SVG (defs + kolommen) in eindstand of een gemengde vorm. */
export function peakSvg(id: string, o: PeakOptions, shape: PeakShape = o): string {
  const stops = PEAK_PALETTES[o.palette] ?? PEAK_PALETTES.pink;
  // Elke kolom apart geblurd (zo blijven de treden zichtbaar).
  const rects = columns(o.bars, shape)
    .map((c) => `<g filter="url(#${id}-blur)"><rect x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}" width="${c.w.toFixed(1)}" height="${c.h.toFixed(1)}" fill="url(#${id}-fill)"/></g>`)
    .join('');
  return (
    `<defs><linearGradient id="${id}-fill" x1="0" y1="1" x2="0" y2="0">` +
    stops.map(([offset, color]) => `<stop offset="${offset}" style="stop-color: ${color}"/>`).join('') +
    `</linearGradient><filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%">` +
    `<feGaussianBlur stdDeviation="${shape.blur.toFixed(1)}"/></filter></defs>` +
    `<g opacity="${shape.opacity.toFixed(3)}">${rects}</g>`
  );
}

/**
 * Een bestaande SVG naar een nieuwe vorm zetten zonder opnieuw op te bouwen (per scrollframe):
 * alleen de rect-attributen, de blur en de dekking.
 */
export function updatePeakSvg(svg: SVGSVGElement, o: PeakOptions, shape: PeakShape) {
  const rects = svg.querySelectorAll('rect');
  const cols = columns(o.bars, shape);
  if (rects.length !== cols.length) {
    svg.innerHTML = peakSvg(svg.dataset.peakSvg!, o, shape);
    return;
  }
  cols.forEach((c, i) => {
    const r = rects[i];
    r.setAttribute('x', c.x.toFixed(1));
    r.setAttribute('y', c.y.toFixed(1));
    r.setAttribute('width', c.w.toFixed(1));
    r.setAttribute('height', c.h.toFixed(1));
  });
  svg.querySelector('feGaussianBlur')?.setAttribute('stdDeviation', shape.blur.toFixed(1));
  svg.querySelector(':scope > g')?.setAttribute('opacity', shape.opacity.toFixed(3));
}
