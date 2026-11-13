/**
 * Position-aware hover op .button, naar "Position Aware Button Hover w/ GSAP" (Mustafa Uncuoğlu,
 * CodePen OJYywaJ). Een cirkel groeit vanaf het punt waar de muis de knop binnenkomt, volgt de muis
 * en krimpt weer weg richting de kant waar hij de knop verlaat.
 *
 * Hoe het werkt (CSS in base.scss):
 * - .button__flair is een vlak zo groot als de knop, met een cirkel van 170% breed om zijn
 *   linkerbovenhoek. Schuif je het vlak x% / y% van zijn eigen maat op (xPercent/yPercent), dan
 *   ligt het middelpunt van de cirkel op x% / y% van de knop: precies onder de muis.
 * - Binnenkomen: positie direct zetten (gsap.set, geen animatie), dan scale 0 → 1 in 0,4s
 *   (power2.out). transform-origin 0 0 = het middelpunt van de cirkel, dus hij groeit vanuit de muis.
 * - Bewegen: het vlak loopt in 0,4s achter de muis aan; elke nieuwe tween overschrijft de vorige.
 * - Verlaten: lopende tweens stoppen, dan naar het uitgangspunt en scale → 0 in 0,3s. Ligt dat
 *   punt in de buitenste 10%, dan schuiven we 20% verder naar buiten, zodat de cirkel de knop
 *   echt "uit" lijkt te rollen in plaats van op de rand te krimpen.
 *
 * Alleen voor een muis (pointerType 'mouse') en zonder prefers-reduced-motion; anders blijft de
 * gewone omkleur-hover. Via event delegation, dus ook knoppen die later in de pagina komen
 * (ClientRouter, player) doen mee. Het vlak is decoratief (aria-hidden) en wordt pas bij de eerste
 * hover toegevoegd.
 */
import { gsap } from 'gsap';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = gsap.utils.clamp(0, 100);

function flairOf(button: HTMLElement) {
  let flair = button.querySelector<HTMLElement>(':scope > .button__flair');
  if (!flair) {
    flair = document.createElement('span');
    flair.className = 'button__flair';
    flair.setAttribute('aria-hidden', 'true');
    button.prepend(flair);
    button.dataset.flair = '';
  }
  return flair;
}

/** Muispositie als percentage van de knop (0–100). */
function point(button: HTMLElement, e: PointerEvent) {
  const r = button.getBoundingClientRect();
  return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
}

/** De knop waar deze pointer-overgang echt in of uit gaat (niet tussen kinderen ervan). */
function crossing(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || reduced.matches) return null;
  const button = (e.target as Element | null)?.closest<HTMLElement>('.button');
  if (!button || (e.relatedTarget instanceof Node && button.contains(e.relatedTarget))) return null;
  return button;
}

document.addEventListener('pointerover', (e) => {
  const button = crossing(e);
  if (!button) return;
  const flair = flairOf(button);
  const { x, y } = point(button, e);
  gsap.killTweensOf(flair);
  gsap.set(flair, { xPercent: x, yPercent: y });
  gsap.to(flair, { scale: 1, duration: 0.4, ease: 'power2.out' });
});

document.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || reduced.matches) return;
  const button = (e.target as Element | null)?.closest<HTMLElement>('.button[data-flair]');
  if (!button) return;
  const flair = flairOf(button);
  const { x, y } = point(button, e);
  gsap.to(flair, { xPercent: x, yPercent: y, duration: 0.4, ease: 'power2', overwrite: 'auto' });
});

document.addEventListener('pointerout', (e) => {
  const button = crossing(e);
  if (!button || button.dataset.flair === undefined) return;
  const flair = flairOf(button);
  const { x, y } = point(button, e);
  const out = (v: number) => (v > 90 ? v + 20 : v < 10 ? v - 20 : v);
  gsap.killTweensOf(flair);
  gsap.to(flair, { xPercent: out(x), yPercent: out(y), scale: 0, duration: 0.3, ease: 'power2.out' });
});
