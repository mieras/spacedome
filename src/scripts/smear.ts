/**
 * Smear: bij hover/focus veegt de tekst van een link even zijwaarts uit, als natte inkt, en trekt
 * dan scherp terug. Losjes naar design.how/vault#smear-type (MIT); dat origineel speelt
 * getraceerde frames af in een shader, dit is een lichte variant met één SVG-filter.
 *
 * Het filter (#sd-smear, in Footer.astro): de tekst zelf, plus een kopie die horizontaal geblurd
 * en naar rechts verschoven is (de veeg). GSAP tweent de blur en verschuiving van "uitgesmeerd"
 * naar 0 met expo.out: eerst snel, dan heel zacht uitlopend, zodat het als opdrogen leest.
 * Eén gedeeld filter: alleen de link die je raakt krijgt het (data-smearing), dus geen botsing.
 *
 * - prefers-reduced-motion: niets.
 * - Puur decoratief: tekst, focus en links blijven ongewijzigd.
 */
import { gsap } from 'gsap';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function smear(el: HTMLElement) {
  if (reduced.matches) return;
  const blur = document.querySelector<SVGFEGaussianBlurElement>('#sd-smear feGaussianBlur');
  const shift = document.querySelector<SVGFEOffsetElement>('#sd-smear feOffset');
  if (!blur || !shift) return;

  document.querySelectorAll<HTMLElement>('[data-smearing]').forEach((o) => delete o.dataset.smearing);
  el.dataset.smearing = '';
  gsap.killTweensOf([blur, shift]);
  gsap
    .timeline({ onComplete: () => delete el.dataset.smearing })
    .fromTo(blur, { attr: { stdDeviation: '14 0.6' } }, { attr: { stdDeviation: '0 0' }, duration: 0.7, ease: 'expo.out' }, 0)
    .fromTo(shift, { attr: { dx: 10 } }, { attr: { dx: 0 }, duration: 0.7, ease: 'expo.out' }, 0);
}

function bind() {
  document.querySelectorAll<HTMLElement>('[data-smear]:not([data-smear-bound])').forEach((el) => {
    el.dataset.smearBound = '';
    el.addEventListener('pointerenter', () => smear(el));
    el.addEventListener('focus', () => smear(el));
  });
}

document.addEventListener('astro:page-load', bind);
