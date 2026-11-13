/*
 * Delen: het deelmenu van het toestel (Web Share API) als dat er is, anders de link kopiëren.
 * Plus een kleine toast in [data-toast] die via aria-live wordt voorgelezen.
 */
import { t } from '../i18n/ui';

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.toggleAttribute('data-visible', true);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.removeAttribute('data-visible'), 2500);
}

export async function share({ url, title }: { url: string; title: string }) {
  const absolute = new URL(url, location.origin).href;
  // Op touch-toestellen het native menu; op desktop is kopiëren meestal wat je wilt.
  const preferNative = matchMedia('(pointer: coarse)').matches;
  if (preferNative && navigator.share) {
    try {
      await navigator.share({ url: absolute, title });
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(absolute);
    toast(t('set.copied'));
  } catch {
    prompt('Copy this link', absolute);
  }
}

// Eén handler voor alle [data-share]-knoppen, ook na paginawissels.
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-share]');
  if (!btn) return;
  share({ url: btn.dataset.shareUrl ?? location.href, title: btn.dataset.shareTitle ?? document.title });
});
