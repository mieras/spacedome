/**
 * Dither op covers: een tweekleurige versie (blue-noise dithering, WebGL) over de foto, met
 * @krisenstab/dither-dither (MIT). De kleurenfoto ligt eronder en komt terug bij hover of focus op
 * de kaart (CSS in components.scss), zo is dit tegelijk de hover-feedback van set- en eventkaarten.
 *
 * - Alleen op .art[data-dither] met een echte afbeelding; gegenereerde art blijft zoals hij is.
 * - Het pakket laden we pas als er zo'n cover op de pagina staat (lazy import).
 * - Bron = de afbeelding die de browser al koos (currentSrc), dus geen extra download van een
 *   ander formaat. Bunny-stills komen zo ook gewoon met Referer van de CDN, nooit tijdens de build.
 * - Eén canvaspixel per CSS-pixel: de stippen blijven even grof op elk formaat. width/height zetten
 *   we zelf met een ResizeObserver, want het element neemt anders de maat van de foto over.
 * - Lukt het niet (geen WebGL2, CORS, laadfout), dan blijft gewoon de kleurenfoto staan.
 * - Geen alt op het element: de cover is decoratief (aria-hidden), en alt heeft in 2.2.2 een bug.
 */
let loader: Promise<unknown> | undefined;
let observer: ResizeObserver | undefined;

const loaded = (img: HTMLImageElement) =>
  img.complete && img.naturalWidth
    ? Promise.resolve()
    : new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(), { once: true });
      });

function size(entries: ResizeObserverEntry[]) {
  for (const { target, contentRect } of entries) {
    const el = target.querySelector(':scope > dither-dither');
    if (!el) continue;
    el.setAttribute('width', String(Math.max(1, Math.round(contentRect.width))));
    el.setAttribute('height', String(Math.max(1, Math.round(contentRect.height))));
  }
}

async function bind(art: HTMLElement) {
  art.dataset.ditherBound = '';
  const img = art.querySelector<HTMLImageElement>(':scope > img');
  if (!img) return;
  try {
    await loaded(img);
  } catch {
    return;
  }
  await (loader ??= import('@krisenstab/dither-dither'));
  const src = img.currentSrc || img.src;
  const style = getComputedStyle(art);
  const el = document.createElement('dither-dither');
  el.className = 'art__dither';
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('object-fit', 'cover');
  el.setAttribute('dark', style.getPropertyValue('--dither-dark').trim() || '#120c24');
  el.setAttribute('light', style.getPropertyValue('--dither-light').trim() || '#f08ac8');
  if (new URL(src, location.href).origin !== location.origin) el.setAttribute('cross-origin', '');
  el.setAttribute('src', src);
  art.append(el);
  (observer ??= new ResizeObserver(size)).observe(art);
}

document.addEventListener('astro:page-load', () => {
  observer?.disconnect();
  observer = undefined;
  if (!('WebGL2RenderingContext' in window)) return;
  document.querySelectorAll<HTMLElement>('.art[data-dither]:not([data-dither-bound])').forEach(bind);
});
