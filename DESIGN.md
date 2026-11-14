# DESIGN.md: Space Dome

Het ontwerp van de Space Dome-site in één document: merk, kleur, typografie, ruimte, vorm, beweging en de player. Voor ontwerpers, ontwikkelaars en AI-agents.

- **Bron van de waarden:** `src/styles/tokens.scss`. Staat er hier iets anders dan in de tokens, dan kloppen de tokens en moet dit document bij.
- **Status:** globale eerste opzet (v0). Logo, definitieve fonts en fotografie volgen zodra de vectorbestanden en beelden er zijn.

---

## 1. Merk in het kort

Space Dome FM is het radio- en videoarchief van Space Dome, rond de **LA beat scene**: beats, trip-hop, instrumentale hiphop, jazz en experimentele ritmes. Van J Dilla tot Flying Lotus, van Massive Attack tot DJ Shadow. *No rush, just hypnotic bass.*

De beeldtaal komt van de eerste poster: **LA bij nacht**. Paars en magenta lucht, palmsilhouetten, lensflares als zwevende bollen, filmkorrel en een gestempeld logo in een cirkel.

De site is een plek om sets te **kijken en te luisteren**, in de geest van NTS: de sets zijn het onderwerp, de interface stapt opzij.

## 2. Principes

1. **De set is de held.** Covers en video zijn groot, de interface is rustig en functioneel.
2. **Nacht eerst.** Het donkere thema is het "echte" Space Dome; het lichte thema is de flyer bij daglicht. Beide volgen de systeemvoorkeur en zijn handmatig te kiezen.
3. **De cirkel is de dome.** Ronde vormen keren terug: het logo, de playknop, dj-avatars, de bollen in de cover-art. Rechthoeken blijven zacht (`--radius-m`).
4. **Korrel en gloed, met mate.** Filmkorrel over de hele site (`--grain-opacity`), één zachte gloed per scherm. Nooit ten koste van leesbaarheid.
5. **Geen haast.** Beweging is traag en zacht (`--dur-slow`, `--ease-out`). Bij `prefers-reduced-motion` staat alles stil.
6. **Toegankelijk is niet onderhandelbaar.** WCAG 2.2 AA, alles met het toetsenbord, de player ook.

## 3. Kleur

OKLCH-tokens met `light-dark()`: één token, twee waarden. Het thema volgt het systeem; `ThemeToggle` zet `data-theme` op `<html>`.

| Token | Licht | Donker | Gebruik |
|---|---|---|---|
| `--color-bg` | lila papier `oklch(97% .012 320)` | nachtindigo `oklch(15% .045 292)` | Achtergrond |
| `--color-surface` | `oklch(93.5% .02 318)` | `oklch(19.5% .055 296)` | Vlakken, player |
| `--color-raised` | `oklch(99.5% .004 320)` | `oklch(24% .065 300)` | Panelen boven vlakken (wachtrij) |
| `--color-fg` | `oklch(19% .06 292)` | `oklch(96% .012 330)` | Tekst |
| `--color-muted` | `oklch(44% .06 300)` | `oklch(76% .045 315)` | Metadata, secundair |
| `--color-line` | `oklch(85% .035 312)` | `oklch(33% .065 300)` | Lijnen, randen |
| `--color-accent` | magenta `oklch(50% .22 356)` | roze `oklch(70% .22 352)` | Playknop, focus, actief |
| `--color-glow` | violet, transparant | violet, transparant | Achtergrondgloed |

Contrast: tekst, muted en accent halen in beide thema's minstens 4,5:1 op `--color-bg`. Bij `prefers-contrast: more` verdwijnt de korrel en wordt muted gelijk aan de tekstkleur.

**Cover-art** (`CoverArt.astro`, `src/lib/art.ts`) is altijd "nacht", ook in het lichte thema: het is beeld, geen interface. Zonder eigen still krijgt elke set een vaste, unieke compositie (gradient, twee bollen, een ring) op basis van zijn ID.

## 4. Typografie

| Rol | Font | Gebruik |
|---|---|---|
| Display | **Stack Sans Notch** (variabel, 200–700) | De grote titels: hero, paginakop, set, dj (`--font-display`). |
| Koppen | **Stack Sans Headline** (variabel, 200–700) | Sectiekoppen, kaarttitels, h2–h4 (`--font-heading`). |
| Tekst | **Stack Sans Text** (variabel, 200–700) | Lopende tekst, interface, metadata. |
| Logo | **Unbounded** | Alleen het tijdelijke woordmerk (`--font-logo`). |

Beide self-hosted via Fontsource (geen verzoeken naar Google, AVG). Gekozen door Maarten op 13-11-2026 (eerst lokaal getest).

**Schaal:** Utopia, fluid tussen 360 en 1920 px. Basis 18 → 20 px, ratio 1.2 → 1.25. Tokens `--step--2` t/m `--step-8`.

- `h1` `--step-5`, `h2` `--step-3`, `h3` `--step-1`.
- Grote display-titels (hero, set, dj, paginakop): `--step-5` op mobiel, `--step-6` vanaf 48–60rem. Bewust groot met veel contrast tegenover de tekst: hero `min(step-7, 100cqi / (langste woord × 0,7))` → `step-8` als plafond (cqi = de intro-kolom; het langste woord van de kop past altijd op één regel, ook als Space Dome de tekst in Sanity wijzigt), paginakop/dj `min(step-7, 14vw)` → `step-8`, settitel `min(step-7, 14cqi)`, regelafstand 0,92.
- Koppen hebben `overflow-wrap: anywhere` + `hyphens: auto` als vangnet. Grids met één kolom altijd `minmax(0, 1fr)`, nooit `auto`/`1fr` (anders rekt lange tekst de pagina op).
- Metadata (`.meta`): `--step--1`, hoofdletters, `letter-spacing: .08em`, tabular nums. Datums zoals op de poster: `30.07.2026`.

## 5. Ruimte en layout

**Ruimte:** Utopia space-schaal, basis 18 → 20 px. Tokens `--space-3xs` t/m `--space-3xl`, de one-up paren (`--space-s-m` enz.) en de custom paren `s-l`, `s-xl`, `m-2xl`, `l-3xl`.

- Zijmarge: `--gutter: var(--space-s-l)`.
- **Breakout-grid** (`.layout`): `content` (46rem) / `popout` / `feature` / `full`.
- **Wrapper** (`.wrapper`): breed raster voor header, footer en kaartrasters, max 96rem.
- Kaartrasters: `.grid` met `--grid-min` (standaard 16rem).
- Carousel (`SetCarousel`): horizontale rij met `scroll-snap-type: x mandatory`. Telefoon 78% per kaart (stukje van de volgende zichtbaar), tablet 2,5, desktop 4. Pijlknoppen rechts in de sectiekop, uitgeschakeld aan begin/eind, verborgen als alles past.
- Footer: merk (1,6fr) + Explore, Genres, Follow; tablet drie kolommen onder het merk, telefoon twee. Aantallen als `.badge` (pil, `--step--2`, tabular-nums). Links in systeem-mono, kapitalen, `--step--1`, accentkleur bij hover. Onderaan een peak gradient (magenta, 10 kolommen; zie `PEAK_FOOTER` in `src/lib/peak.ts`) die tijdens het scrollen van vorm verandert: elke waarde mengt van `start` (vlakke band, gezakt, dof) naar de eindstand helemaal onderaan, met ease-in-out. Geen scale/transform, zodat de randen altijd tot de zijkant lopen; het copyright staat op de donkere vloer en is daarom altijd licht.
- Setpagina: hero met video en info naast elkaar vanaf 64rem (`1.8fr / 1fr`). Het podium is daar sticky (onder de header) tot het einde van de hero; daarna mini-video. Titel `min(var(--step-6), 12cqi)` op de infokolom. Beschrijving en tracklist als tabs (`<sd-tabs>`, `src/scripts/tabs.ts`): onderstreepte tabs in meta-stijl, actieve tab met accentlijn, aantal tracks als pil.
- Play-knop met tekst: `min-inline-size: 7.25rem`, zodat Play en Pause even breed zijn.

## 6. Vorm

- Radius: `--radius-s` (6px), `--radius-m` (12px, covers en kaarten), `--radius-l`, `--radius-round` (knoppen, chips, avatars).
- Knoppen zijn pillen. De playknop is een cirkel in het accent.
- Randen 1px in `--color-line`.

## 7. Beweging

| Token | Waarde | Waarvoor |
|---|---|---|
| `--dur-fast` | 150ms | Hover, kleine toestanden |
| `--dur` | 300ms | Standaard, wegfaden van de pagina |
| `--dur-slow` | 600ms | Binnenkomen van de pagina, player |
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` | Bijna alles |

- **Paginatransities:** `<ClientRouter />`. De oude pagina fadet weg, de nieuwe fadet in en schuift 0,75rem omhoog. Header en player hebben een eigen `view-transition-name` en blijven dus staan.
- **Player:** de video schuift met een FLIP-animatie tussen gedockt (op de setpagina) en mini (onderin, rechts of links). Tussen pagina's "morpht" hij via de view transition.
- **Reveal bij laden** (`data-reveal`, GSAP SplitText): `chars` (datum, per teken uit een masker), `words` (titels, per woord), `up` (blokken: 18px omhoog + fade, stagger 0,07s), `media` (flyer: clip-path van onder naar boven + zoom 1,04 → 1). Easing `expo.out` voor tekst en beeld, `power3.out` voor blokken, ±1s. Gebruikt op home (titel, intro, knoppen) en de setpagina (niet op het podium: de gedockte video moet er exact op blijven liggen).
- **Reduced motion:** alle duurtokens worden 0,01 ms en de view-transition-animaties staan uit.

## 8. De player

De kern van de site. Eén `<sd-player>` in de layout met `transition:persist`: hij blijft spelen terwijl je door de site navigeert.

| Toestand | Wanneer | Hoe |
|---|---|---|
| Uit | Niets geladen | Niet zichtbaar |
| Balk | Er is een set geladen | Vaste balk onderin: cover, titel, dj's, play, ±15/30 s, tijd, wachtrij, delen, sluiten. De voortgang is een dunne balk bovenaan. |
| Gedockt | Op de pagina van de spelende set, podium in beeld | De video ligt precies over het podium (`[data-player-stage]`) |
| Mini | Elders, of het podium is uit beeld gescrold | Video zwevend onderin boven de balk, rechts of links. Versleepbaar (snapt naar de dichtste kant) of via de wisselknop (WCAG 2.5.7). Breedte `clamp(12rem, 28vw, 22rem)`, op telefoon `clamp(12rem, 58vw, 16rem)` |
| Alleen audio | Bezoeker kiest "luisteren" | Geen video, alleen de balk; stream op de laagste kwaliteit (240p). De knop in de balk wordt een camera en blijft ook op mobiel staan als weg terug |

- **Wachtrij:** sets toevoegen vanaf elke kaart. Opgeslagen in `localStorage`, dus geen account nodig. De speelpositie wordt bewaard: wie terugkomt, gaat verder waar hij was.
- **Delen:** de link naar de set, of vanuit de player de link op het huidige moment (`?t=123`).
- **Media Session:** titel en cover op het vergrendelscherm, met play, pauze en spoelen.
- **Toetsenbord:** alle bediening zit in echte knoppen en een range-slider met `aria-valuetext`. Wijzigingen worden gemeld via een `aria-live`-regio.

## 9. Componenten (v0)

| Component | Doel |
|---|---|
| `Logo` | Ring met SPACE DOME. Tijdelijk, nagebouwd in Unbounded; vervangen door het vectorlogo. |
| `CoverArt` | Still van de set, of gegenereerde art als fallback |
| `SetCard` | Cover met playknop, titel, dj's, datum, duur |
| `PlayButton`, `QueueButton`, `ShareButton` | Acties op een set, overal gelijk |
| `Tracklist` | Genummerde lijst; tijdcodes optioneel (later: naar een track springen) |
| `DjAvatar` | Rond, foto of initialen op cover-art |

## 10. Open punten

- [ ] Logo als vector (SVG/AI/PDF) en het font van het logo
- [x] Fontkeuze: Stack Sans Notch / Headline / Text
- [ ] Fotografie van dj's en shows
- [ ] Stills uit de video (thumbnail-picker via Bunny Stream)
- [ ] Nederlandse vertaling (interface staat klaar in `src/i18n/ui.ts`)
- [ ] OG-afbeelding per set (nu: cover of standaardbeeld)

## Knoppen
- `.button`: pil met rand. Hover met een muis: een cirkel (170% van de knop) vult de knop vanaf het punt waar de pointer binnenkomt, volgt hem (0,4s, power2) en rolt eruit waar hij weggaat (0,3s). Naar "Position Aware Button Hover w/ GSAP" (CodePen OJYywaJ), in `src/scripts/button-flair.ts` met event delegation. Kleur van de vulling: `--_bg-hover`, tekst: `--_fg-hover`.
- Touch, toetsenbord, geen JS en `prefers-reduced-motion`: gewoon omkleuren.

## Cover-art
- Zonder still of flyer: gegenereerde art per seed (`src/lib/art.ts`). Die leeft: de twee lichtbollen drijven rond, de tint schuift ±12° en de ring zweeft en ademt (`art-drift`, `art-ring` in `components.scss`, via `@property`). Duur 14–24s en startpunt uit de seed, zodat covers niet gelijk lopen. Hover op een kaart: ring schaalt naar 1,14.
- Niet bij `prefers-reduced-motion` en niet zodra er een echte afbeelding is.

## Stijlgids
- `/brand` toont tokens, componenten en effecten live uit de code. De peak gradient heeft er een speeltuin; de peak-instelling van de footer staat in `PEAK_FOOTER` (`src/lib/peak.ts`). Nieuw component of token: zet het daar ook bij.
