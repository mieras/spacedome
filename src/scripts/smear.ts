/**
 * Smear: bij hover/focus veegt tekst even zijwaarts uit, als natte inkt, en trekt dan scherp terug.
 * Losjes naar design.how/vault#smear-type (MIT); dat origineel speelt getraceerde frames af in een
 * shader, dit is een lichte variant met één SVG-filter. Vervangt de hover-underline op titels.
 *
 * Markup:
 * - data-smear op het element dat uitveegt (een link, of een span in een link).
 * - data-smear-scope op een voorouder (kaart) als hover op de hele kaart moet werken.
 * Focus werkt via de link zelf (of de dichtstbijzijnde link eromheen).
 *
 * Instellen per element (alles optioneel, waarden gelden voor 16px tekst en schalen mee):
 * - data-smear-amount   hoe ver de veeg uitsmeert, horizontale blur in px      (standaard 14)
 * - data-smear-shift    hoe ver de veeg naar opzij ligt, in px                  (standaard 10)
 * - data-smear-spread   verticale blur in px, 0 = strakke strepen               (standaard 0.6)
 * - data-smear-duration hoe lang het opdrogen duurt, in seconden                (standaard 0.7)
 * - data-smear-dir      'right' of 'left'                                       (standaard right)
 * - data-smear-ease     een GSAP-ease                                           (standaard expo.out)
 * Speeltuin met schuifjes: /brand#effects.
 *
 * Het filter (#sd-smear, in BaseLayout): de tekst plus een kopie die horizontaal geblurd en naar
 * rechts verschoven is (de veeg). GSAP tweent blur en verschuiving van "uitgesmeerd" naar 0 met
 * expo.out: eerst snel, dan heel zacht uitlopend, zodat het als opdrogen leest. De veeg schaalt
 * mee met de lettergrootte, zodat een grote titel net zo ver uitsmeert als een kleine link.
 * Eén gedeeld filter: alleen het element dat je raakt krijgt het (data-smearing).
 *
 * - prefers-reduced-motion: niets.
 * - Puur decoratief: tekst, focus en links blijven ongewijzigd.
 */
import { gsap } from 'gsap';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export const SMEAR_DEFAULTS = { amount: 14, shift: 10, spread: 0.6, duration: 0.7, dir: 'right', ease: 'expo.out' };

function optionsOf(el: HTMLElement) {
  const d = el.dataset;
  const num = (v: string | undefined, fallback: number) => (v !== undefined && v !== '' && !isNaN(+v) ? +v : fallback);
  return {
    amount: num(d.smearAmount, SMEAR_DEFAULTS.amount),
    shift: num(d.smearShift, SMEAR_DEFAULTS.shift),
    spread: num(d.smearSpread, SMEAR_DEFAULTS.spread),
    duration: num(d.smearDuration, SMEAR_DEFAULTS.duration),
    dir: d.smearDir ?? SMEAR_DEFAULTS.dir,
    ease: d.smearEase || SMEAR_DEFAULTS.ease,
  };
}

export function smear(el: HTMLElement) {
  if (reduced.matches) return;
  const blur = document.querySelector<SVGFEGaussianBlurElement>('#sd-smear feGaussianBlur');
  const shift = document.querySelector<SVGFEOffsetElement>('#sd-smear feOffset');
  if (!blur || !shift) return;

  const opt = optionsOf(el);
  const scale = Math.min(parseFloat(getComputedStyle(el).fontSize) / 16, 4);
  const dir = opt.dir === 'left' ? -1 : 1;
  document.querySelectorAll<HTMLElement>('[data-smearing]').forEach((o) => delete o.dataset.smearing);
  el.dataset.smearing = '';
  gsap.killTweensOf([blur, shift]);
  gsap
    .timeline({ onComplete: () => delete el.dataset.smearing })
    .fromTo(blur, { attr: { stdDeviation: `${opt.amount * scale} ${opt.spread * scale}` } }, { attr: { stdDeviation: '0 0' }, duration: opt.duration, ease: opt.ease }, 0)
    .fromTo(shift, { attr: { dx: dir * opt.shift * scale } }, { attr: { dx: 0 }, duration: opt.duration, ease: opt.ease }, 0);
}

function bind() {
  document.querySelectorAll<HTMLElement>('[data-smear]:not([data-smear-bound])').forEach((el) => {
    el.dataset.smearBound = '';
    const hover = el.closest<HTMLElement>('[data-smear-scope]') ?? el;
    const focus = el.closest<HTMLElement>('a, button') ?? el;
    hover.addEventListener('pointerenter', () => smear(el));
    focus.addEventListener('focus', () => smear(el));
  });
}

document.addEventListener('astro:page-load', bind);
