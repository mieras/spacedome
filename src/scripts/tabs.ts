/**
 * <sd-tabs>: tabs volgens het WAI-ARIA-patroon (pijltjes, Home/End, automatische activatie).
 * Zonder JS (of met één paneel) staan de panelen gewoon onder elkaar met hun koppen.
 * Een custom element koppelt zichzelf ook na een paginawissel van de ClientRouter.
 * Stuurt 'tabs:change' ({ index, id }) bij elke wissel. Stijlen: components.scss (.tabs__*).
 */
class SdTabs extends HTMLElement {
  connectedCallback() {
    const list = this.querySelector<HTMLElement>('[data-tabs-list]');
    if (!list || this.dataset.ready !== undefined) return;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((tab) => this.querySelector<HTMLElement>(`#${tab.getAttribute('aria-controls')}`));
    if (panels.some((p) => !p)) return;

    this.dataset.ready = '';
    list.hidden = false;
    panels.forEach((panel, i) => {
      panel!.setAttribute('role', 'tabpanel');
      panel!.setAttribute('aria-labelledby', tabs[i]!.id); // het tabblad is nu het label
      panel!.tabIndex = 0;
      panel!.querySelector<HTMLElement>('[data-tabs-heading]')?.classList.add('visually-hidden');
    });

    const select = (index: number, focus = false) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i]!.hidden = !on;
      });
      if (focus) tabs[index]!.focus();
      this.dispatchEvent(new CustomEvent('tabs:change', { detail: { index, id: tabs[index]!.id } }));
    };

    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
    list.addEventListener('keydown', (e) => {
      const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (current < 0) return;
      const last = tabs.length - 1;
      const next = { ArrowRight: current === last ? 0 : current + 1, ArrowLeft: current === 0 ? last : current - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(next, true);
    });

    select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
  }
}

if (!customElements.get('sd-tabs')) customElements.define('sd-tabs', SdTabs);
