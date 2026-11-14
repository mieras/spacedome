// Eigen variant van <VisualEditing> uit @sanity/astro, met een history-adapter (_standards/SANITY.md §3 stap 8).
import { VisualEditing as SanityVisualEditing, type HistoryAdapter } from '@sanity/visual-editing/react';

function currentUrl() {
  return `${location.pathname}${location.search}${location.hash}`;
}

const historyAdapter: HistoryAdapter = {
  // In de preview is elke klik een volledige page load (zie het script in BaseLayout),
  // dus elke pagina meldt zich één keer bij de Studio.
  subscribe(navigate) {
    navigate({ type: 'replace', url: currentUrl() });
    return () => {};
  },
  // Navigatie vanuit de Studio (adresbalk, "Used on … pages", terug/vooruit).
  update(update) {
    if (update.type === 'pop') {
      history.back();
      return;
    }
    const target = new URL(update.url, location.origin);
    // De Studio stuurt de gemelde URL soms terug: dan niet herladen.
    if (`${target.pathname}${target.search}${target.hash}` === currentUrl()) return;
    if (update.type === 'replace') location.replace(target);
    else location.assign(target);
  },
};

export default function VisualEditing() {
  return (
    <SanityVisualEditing
      portal
      history={historyAdapter}
      refresh={() => {
        // Na een wijziging in de Studio: pagina opnieuw ophalen met de drafts.
        location.reload();
        return Promise.resolve();
      }}
    />
  );
}
