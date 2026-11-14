# AGENTS.md: Space Dome

Instructies voor AI-agents (Claude Code, Cursor, Codex) en ontwikkelaars die aan dit project werken.
Lees eerst `README.md` voor context, `CHANGELOG.md` voor recente wijzigingen en `DESIGN.md` voor het ontwerp.

## Project
- Klant: Space Dome (vriendendienst) · Bedrijf: MIERAS · SLA: nee
- Stack: Astro 7.4 server-rendered op Netlify, content uit Sanity, Node 22.23.5 (zie `.nvmrc`)
- Maarten maakt geen kosten voor dit project: betaalde diensten (video, domein) komen op naam van Space Dome.

## Werkwijze
- Werk nooit direct op `main`. Branch vanaf `staging` → PR naar `staging` → deploy preview → merge. Naar `main` alleen gebundelde releases en hotfixes, volgens `~/Code/_standards/DEPLOY.md`.
- Branchnamen: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commit nooit `.env`-bestanden of tokens. Nieuwe variabelen: naam toevoegen aan `.env.example` en de README-tabel.
- Variabelen met `PUBLIC_` komen in de browser terecht: nooit voor tokens.

## Documentatie bijhouden (verplicht)
- Elke wijziging die je commit: voeg een regel toe onder `## [Unreleased]` in `CHANGELOG.md`.
- Bij een release (`staging → main`): zet `[Unreleased]` om naar een datumkop.
- Verandert setup, env, stack of deploy? Werk `README.md` bij. Verandert het ontwerp? Werk `DESIGN.md` bij (de tokens in `src/styles/tokens.scss` zijn leidend).

## Conventies
- Moderne CSS: custom properties, OKLCH met `light-dark()`, logical properties, cascade layers. Type en ruimte alleen via de Utopia-tokens (`--step-*`, `--space-*`).
- Klassen die je aan een child-component doorgeeft (`class="…"`) stijl je in de parent met `:global(.klasse)`, anders pakt Astro's scoping ze niet.
- Toegankelijkheid: WCAG 2.2 AA. Semantische HTML, focus-states, `prefers-reduced-motion` respecteren.
- AVG: geen cookies of tracking zonder toestemming; embeds pas na een klik (`~/Code/_standards/CONSENT.md`). Statistiek: TODO.
- Content alleen via `src/lib/content.ts`; die haalt alles op via `loadQuery()` (`src/lib/sanity/load-query.ts`), nooit direct `sanityClient.fetch`. Visual Editing en cache volgens `~/Code/_standards/SANITY.md` §3 en §6. Modelwijziging: `schema/` → query in `src/lib/sanity/queries.ts` → `npm run typegen` → `content.ts` → component.
- Stega: zichtbare tekst houdt de onzichtbare tekens (overlays in de preview). Alles wat je vergelijkt, in een URL, `class`, `data-item` of de `<head>` zet: `stegaClean()` of `stripStega()` (dat laatste ook midden in samengestelde tekst). Symptoom als je het vergeet: links of logica breken alleen in de preview.
- Geen `getStaticPaths` of `prerender` op pagina's met content (dan geen drafts in de preview en geen purge). Onbekende slug: `return Astro.rewrite('/404')`.
- `src/content/` is een archief (bron voor `sanity:migrate` en `set:add`), niet meer voor de site.
- Sanity-schema gewijzigd of query toegevoegd? `npm run typegen`. Vertaalbare velden: `internationalizedArray*`, query op `language` (plugin v5), met terugval op `en`.
- Afbeeldingen: profiel Website volgens `~/Code/_standards/IMAGES.md`.
- Transities: laag 1-2 (ClientRouter + PageProgress) volgens `~/Code/_standards/TRANSITIONS.md`.
- SEO en AI readiness volgens `~/Code/_standards/SEO.md`.

## Projectspecifiek
- **Scope**: alleen Space Dome FM (radioshows en sets, dj's, genres). Geen avonden, agenda, RA-links of venue-logo's. Plan en architectuur: `docs/plan.md` (lokaal, niet in git) (SSR op Netlify met CDN-cache en purge via Sanity-webhook, geen rebuild per publicatie).
- **Player** (`src/scripts/player.ts`): het `<sd-player>`-element is persistent; het script draait één keer. Per pagina alleen opnieuw koppelen via `astro:after-swap` / `astro:page-load`. Niet het element uit het document halen (dan pauzeert de video).
- Elke knop die iets met de player doet, gebruikt `data-player-play` / `data-player-queue` met `data-item` (JSON van `toPlayerItem()`). Geen eigen click-handlers per knop.
- Het podium op een setpagina is `[data-player-stage="<set-id>"]`; de video ligt er overheen via CSS anchor positioning (`anchor-name: --sd-stage`), fallback absoluut in documentcoördinaten. Op desktop is het podium sticky.
- HLS: hls.js overal behalve Safari (native). Chromium meldt soms "maybe" voor HLS maar kan niet alles; vertrouw daar niet op.
- Video: STACK (map READY) → Bunny Stream via `npm run set:add` (zie README). Bunny weigert verzoeken zonder Referer: haal Bunny-stills nooit op tijdens de build (geen `getImage`/`<Image>` op Bunny-URL's). Signed URLs (`BUNNY_STREAM_TOKEN_KEY`) komen later en vragen een edge function.
- Mux-teststreams in de dummy-sets zijn placeholders.
- Content is grotendeels dummy (fictieve dj's). Niet publiceren zonder echte content.
- `src/settings.ts`: `noindex: true` tot livegang.
- Statuspagina (`/coming-soon`, middleware): main en staging hebben elk een eigen status in Site-instellingen (`status` / `statusStaging`), gekozen via `__DEPLOY_CONTEXT__` (Netlify `CONTEXT` bij de build). Main staat op Coming soon tot livegang.
- `/brand` (`src/pages/brand.astro`) is de stijlgids: nieuwe componenten, tokens of effecten daar ook tonen. Geen underline als hover-feedback op kaarten. Knoppen: `.button` krijgt de position-aware vulling vanzelf (`src/scripts/button-flair.ts`).
