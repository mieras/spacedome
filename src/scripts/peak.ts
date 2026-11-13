/**
 * Peak gradient aan het scrollen koppelen: de vorm zelf mengt van `start` naar de eindstand.
 *
 * Voortgang p: 0 als de bovenkant van de gradient de onderkant van het scherm raakt, 1 als hij er
 * helemaal in staat (helemaal onderaan scrollen). Elke frame (rAF, alleen terwijl hij in beeld is)
 * zetten we de kolommen, blur en dekking opnieuw via updatePeakSvg. Geen transform/scale.
 *
 * - Zonder JS en bij prefers-reduced-motion: de eindstand (zo rendert de build hem ook).
 * - Instelling staat als JSON in data-peak op .peak; /brand kan die vervangen en 'peak:config'
 *   sturen om de footer live te proberen.
 * - ClientRouter: per pagina opnieuw koppelen; observers van de vorige pagina ruimen we op.
 */
import { peakAt, updatePeakSvg, type PeakOptions } from '../lib/peak';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cleanups: (() => void)[] = [];

function bind(el: HTMLElement) {
  const svg = el.querySelector<SVGSVGElement>('svg[data-peak-svg]');
  if (!svg || !el.dataset.peak) return;
  let options = JSON.parse(el.dataset.peak) as PeakOptions;
  let frame = 0;
  let last = -1;

  const draw = () => {
    frame = 0;
    const r = el.getBoundingClientRect();
    const p = r.height ? (innerHeight - r.top) / r.height : 1;
    const clamped = Math.min(Math.max(p, 0), 1);
    if (clamped === last) return;
    last = clamped;
    updatePeakSvg(svg, options, peakAt(options, clamped));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      addEventListener('scroll', schedule, { passive: true });
      addEventListener('resize', schedule);
      schedule();
    } else {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      // Uit beeld: alvast in de stand zetten waarin hij straks binnenkomt (of de eindstand).
      last = -1;
      schedule();
    }
  });
  io.observe(el);

  const onConfig = () => {
    options = JSON.parse(el.dataset.peak!) as PeakOptions;
    last = -1;
    schedule();
  };
  el.addEventListener('peak:config', onConfig);

  cleanups.push(() => {
    io.disconnect();
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    el.removeEventListener('peak:config', onConfig);
    if (frame) cancelAnimationFrame(frame);
  });
}

document.addEventListener('astro:page-load', () => {
  cleanups.forEach((c) => c());
  cleanups = [];
  if (reduced.matches) return;
  document.querySelectorAll<HTMLElement>('.peak[data-peak]').forEach(bind);
});
