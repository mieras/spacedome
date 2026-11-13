/**
 * Peak gradient: geometrie, paletten en de footer-instelling op één plek.
 * Gebruikt door PeakGradient.astro (bij de build) en de configurator op /brand (in de browser),
 * zodat de preview exact hetzelfde tekent als de footer.
 *
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

export type PeakOptions = {
  /** Aantal kolommen. */
  bars: number;
  /** Blur in viewBox-eenheden (box is 1271 × 599). */
  blur: number;
  /** Hoogte van de middelste kolom, als deel van de box. */
  peak: number;
  /** Hoogte van de buitenste kolommen, als deel van de middelste. */
  valley: number;
  /** Hoe de hoogte vanuit het midden afvalt: 1 = recht (piramide), hoger = boller. */
  power: number;
  /** Hoeveel de kolommen overlappen (1 = naad aan naad). */
  overlap: number;
  palette: PeakPalette;
  /*
   * Rustige stand: zo staat hij als de footer net in beeld komt. Naar beneden scrollen laat hem
   * openbloeien tot de stand hierboven (helemaal onderaan); terugscrollen maakt hem weer rustig.
   */
  /** Hoogte als deel van de eindstand. */
  calmHeight: number;
  /** Breedte als deel van de eindstand. */
  calmWidth: number;
  calmOpacity: number;
  /** Verzadiging (1 = vol). */
  calmSaturate: number;
};

/** De footer. */
export const PEAK_FOOTER: PeakOptions = {
  bars: 10,
  blur: 35,
  peak: 0.84,
  valley: 0.45,
  power: 2.17,
  overlap: 2,
  palette: 'magenta',
  calmHeight: 0.3,
  calmWidth: 0.85,
  calmOpacity: 0.45,
  calmSaturate: 0.5,
};

/** De rustige stand als CSS custom properties (voor de keyframes in PeakGradient). */
export const peakCalmStyle = (o: PeakOptions) =>
  `--peak-calm-h: ${o.calmHeight}; --peak-calm-w: ${o.calmWidth}; --peak-calm-o: ${o.calmOpacity}; --peak-calm-s: ${o.calmSaturate};`;

/** Bloei-curve: ease-in, zodat het meeste gebeurt als je onderaan aankomt. Zelfde als de CSS. */
export const peakBloomEase = (p: number) => p * p;

/** De stand bij scrollvoortgang p (0 = rustig, 1 = bloei), voor de preview op /brand. */
export function peakAt(o: PeakOptions, p: number) {
  const e = peakBloomEase(Math.min(Math.max(p, 0), 1));
  const mix = (a: number) => a + (1 - a) * e;
  return {
    transform: `scale(${mix(o.calmWidth)}, ${mix(o.calmHeight)})`,
    opacity: String(mix(o.calmOpacity)),
    filter: `saturate(${mix(o.calmSaturate)})`,
  };
}

export const PEAK_W = 1271;
export const PEAK_H = 599;

/** De binnenkant van de SVG (defs + kolommen). Ids krijgen `id` als voorvoegsel. */
export function peakSvg(id: string, o: PeakOptions): string {
  const bars = Math.max(1, Math.round(o.bars));
  const pitch = PEAK_W / bars;
  const width = pitch * o.overlap;
  const mid = (bars - 1) / 2;
  const stops = PEAK_PALETTES[o.palette] ?? PEAK_PALETTES.pink;

  const rects = Array.from({ length: bars }, (_, i) => {
    const t = mid ? Math.abs(i - mid) / mid : 0;
    const h = o.peak * PEAK_H * (o.valley + (1 - o.valley) * (1 - t ** o.power));
    const x = i * pitch - (width - pitch) / 2;
    // Elke kolom apart geblurd (zo blijven de treden zichtbaar). Onderkant doorgetrokken voorbij de box, zodat de blur onderaan niet lichter wordt.
    return `<g filter="url(#${id}-blur)"><rect x="${x.toFixed(1)}" y="${(PEAK_H - h).toFixed(1)}" width="${width.toFixed(1)}" height="${(h + o.blur * 3).toFixed(1)}" fill="url(#${id}-fill)"/></g>`;
  }).join('');

  return (
    `<defs><linearGradient id="${id}-fill" x1="0" y1="1" x2="0" y2="0">` +
    stops.map(([offset, color]) => `<stop offset="${offset}" style="stop-color: ${color}"/>`).join('') +
    `</linearGradient><filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%">` +
    `<feGaussianBlur stdDeviation="${o.blur}"/></filter></defs>` +
    rects
  );
}
