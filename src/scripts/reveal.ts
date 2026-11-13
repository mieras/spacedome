/**
 * Reveal-animatie bij het laden van een pagina (GSAP + SplitText).
 *
 * Markeer elementen met data-reveal:
 * - "chars": tekst per teken omhoog uit een masker (de grote datum)
 * - "words": tekst per woord omhoog uit een masker (titels)
 * - "up":    blok faadt in en schuift 18px omhoog (content: feiten, tekst, line-up)
 * - "media": beeld wordt van onder naar boven onthuld (clip-path), met een lichte zoom-out
 *
 * Alles komt in één tijdlijn in documentvolgorde, met een kleine overlap, zodat het als één
 * beweging leest. Easing: expo.out (snel weg, heel zacht uitlopen) voor tekst en beeld,
 * power3.out voor de blokken. Na afloop zetten we de split terug (gewone tekst, herberekent
 * regels bij resize) en ruimen we inline styles op.
 *
 * - prefers-reduced-motion: geen animatie, alles direct zichtbaar.
 * - Zonder JS of als dit script faalt: CSS verbergt niets (scripting) of toont na 2,5s alsnog.
 * - ClientRouter: draait op elke astro:page-load; data-revealed voorkomt dubbel animeren.
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const EASE_TEXT = 'expo.out';
const EASE_BLOCK = 'power3.out';

async function reveal() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')];
  if (!els.length) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => (el.dataset.revealed = ''));
    return;
  }

  // Splitsen pas als de fonts er zijn, anders kloppen de tekenbreedtes niet.
  await document.fonts.ready;

  const splits: SplitText[] = [];
  const tl = gsap.timeline({
    defaults: { duration: 1, ease: EASE_TEXT },
    onComplete: () => {
      splits.forEach((s) => s.revert());
      gsap.set(els, { clearProps: 'all' });
    },
  });

  let blocks = 0;
  els.forEach((el, i) => {
    const kind = el.dataset.reveal;
    // Elk volgend element begint iets later; blokken onderling met een vaste stagger.
    const at = kind === 'up' ? 0.3 + blocks++ * 0.07 : i * 0.08;

    if (kind === 'chars' || kind === 'words') {
      const split = SplitText.create(el, {
        type: kind,
        mask: kind,
        // De datum heeft al een leesbare versie voor schermlezers; titels krijgen een aria-label.
        aria: el.closest('[aria-hidden="true"]') ? 'none' : 'auto',
      });
      splits.push(split);
      tl.from(split[kind], { yPercent: 105, stagger: kind === 'chars' ? 0.028 : 0.06 }, at);
    } else if (kind === 'media') {
      const radius = getComputedStyle(el).borderRadius;
      tl.fromTo(
        el,
        { clipPath: `inset(0% 0% 100% 0% round ${radius})`, scale: 1.04 },
        { clipPath: `inset(0% 0% 0% 0% round ${radius})`, scale: 1, duration: 1.3 },
        0,
      );
    } else {
      tl.from(el, { autoAlpha: 0, y: 18, duration: 0.9, ease: EASE_BLOCK }, at);
    }
  });

  // De from-waarden staan nu (immediateRender): CSS mag het verbergen loslaten.
  els.forEach((el) => (el.dataset.revealed = ''));
}

document.addEventListener('astro:page-load', reveal);
