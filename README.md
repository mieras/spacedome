# spacedome

> Site voor Space Dome FM: radioshows en DJ-sets uit de LA beat scene kijken en luisteren, met een player die site-breed doorspeelt, plus dj's en genres. De losse avonden (Melkweg, De Nachtzuster) vallen erbuiten. Plan: `docs/plan.md` (lokaal, niet in git).

| | |
|---|---|
| **Klant** | Space Dome (vriendendienst) |
| **Bedrijf** | MIERAS |
| **Status** | WIP · eerste versie op Markdown-content, Sanity volgt |
| **SLA** | Nee |
| **Live** | TODO (domein nog niet gekozen, spacedome.xyz is niet beschikbaar; zie `docs/mail-intake.md`) |
| **Netlify** | team MIERAS, site `spacedome` (later naar het account van Space Dome) |
| **CMS** | Nog geen: Markdown in `src/content/`. Later Sanity (eerst MIERAS-account, daarna overdragen) |
| **Repo** | [github.com/mieras/spacedome](https://github.com/mieras/spacedome) |
| **Notion** | Repo-overzicht (privé) |

## Stack

- Astro 7.4 · Node 22.23.5 (`.nvmrc`) · statisch
- Styling: SCSS met `utopia-core-scss` (fluid type en space), OKLCH-tokens met `light-dark()`, cascade layers
- Fonts: Stack Sans Notch (grote titels), Stack Sans Headline (koppen), Stack Sans Text (tekst), Unbounded alleen voor het logo; self-hosted via Fontsource
- Video: HLS via hls.js (Safari native). Nu teststreams van Mux; straks Bunny Stream
- Animatie: CSS + View Transitions (`<ClientRouter />`); GSAP 3.15 + SplitText alleen voor de reveal bij het laden (`src/scripts/reveal.ts`, `data-reveal`)
- Consent: geen cookies of tracking. Statistiek: geen (TODO) · Hosting: Netlify

## Lokaal starten

```bash
nvm use            # Astro 7.4 vraagt Node ≥ 22.23.4
npm install
npm run dev        # http://localhost:4321
```

Overige scripts: `npm run build`, `npm run preview`, `npm run check`.

### Testvideo

De set `stack-test` speelt `public/media/stack-test.mp4` (8,6 MB): een korte opname uit de STACK-map van Space Dome. Tijdelijk; straks komen video's uit Bunny Stream en gaat dit bestand uit git.

### Environment-variabelen

Nog geen nodig. De namen voor later staan in `.env.example`.

| Naam | Waarvoor | Waar te vinden |
|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Sanity-project (later) | sanity.io/manage |
| `PUBLIC_SANITY_DATASET` | Dataset (later) | sanity.io/manage |
| `SANITY_API_READ_TOKEN` | Drafts / visual editing, geheim (later) | sanity.io/manage → API → Tokens |
| `BUNNY_STREAM_LIBRARY_ID` | Videobibliotheek | Bunny → Stream → library → API |
| `BUNNY_STREAM_CDN_HOSTNAME` | Hostnaam voor de HLS-URL's (`vz-….b-cdn.net`) | Bunny → Stream → library → API |
| `BUNNY_STREAM_API_KEY` | Importscript (STACK → Bunny), geheim, alleen lokaal | Bunny → Stream → library → API |
| `BUNNY_STREAM_TOKEN_KEY` | Getekende URL's tegen hotlinken, geheim | Bunny → CDN → pull zone van de library → Security → Token authentication |
| `STACK_SHARE_URL` | Alleen-lezen share van de map Recordings, geheim | STACK → map → Delen |

Waarden staan nooit in git.

## Structuur

```
src/
  components/   UI (SetCard, PlayButton, Player, CoverArt, …)
  content/      Markdown: sets, djs, genres, pages
  i18n/         Interfaceteksten (EN, NL in voorbereiding)
  layouts/      BaseLayout (head, header, footer, player)
  lib/          Datalaag (content.ts), art, format, seo
  pages/        Routes
  scripts/      player.ts (site-brede player), share.ts
  styles/       tokens.scss (Utopia + kleur), layout, base, player
docs/           Plan, mails aan Space Dome en notities (lokaal, in .gitignore: de repo is publiek)
DESIGN.md       Ontwerpsysteem
```

## Content en CMS

- **Sets:** titel, omschrijving (body), datum, dj's, genres, video (`src`, `duration`, `bunny`, `stack`, `thumbnail`), eigen still (`poster`, anders de Bunny-thumbnail), tracklist (artiest, titel, label, optioneel tijd).
- **DJs:** naam, plaats, resident, foto, links, bio (body).
- **Genres:** titel, omschrijving.
- **Pages:** about.
- Schema: `src/content.config.ts`. De Markdown-content is **dummy** (fictieve dj's), behalve de sets van Drvg Cvltvre en Ono-Sendai Sound en de about-tekst (die gaat nog over de avonden; nieuwe tekst voor FM komt van Space Dome).
- Overstap naar Sanity volgens `~/Code/_standards/SANITY-MIGRATIE.md`; alle pagina's lezen via `src/lib/content.ts`.

### Set toevoegen (tot Sanity er is)

Sander zet de afgemonteerde opname in STACK, map **READY**, en stuurt de gegevens (titel, dj's, genres, tracklist). Dan:

```bash
npm run set:add            # kies een video uit STACK/READY en beantwoord de vragen
npm run set:add -- --list  # alleen kijken wat er staat (✓ = al op de site)
```

Het script (`scripts/set-add.mjs`) laat Bunny Stream de video zelf uit STACK ophalen (server naar server), maakt `src/content/sets/<slug>.md` aan (plus nieuwe dj's/genres) en wacht tot Bunny klaar is met coderen. Daarna: tracklist en beschrijving aanvullen, checken met `npm run dev`, branch → PR naar `staging`.

- Nodig in `.env`: `STACK_SHARE_URL`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_CDN_HOSTNAME`, `BUNNY_STREAM_API_KEY`.
- Bij STACK doet het script alleen lees-verzoeken.
- Opties: `--folder Recordings` (andere map), `--draft` (alleen zichtbaar in dev), `--no-wait`.
- Bunny staat op **Block direct url file access**: zonder Referer geen toegang. Stills laden daarom direct in de browser (geen Astro-beeldoptimalisatie) en zijn geen OG-beeld. **Allowed domains** staan op `localhost`, `localhost:4321`, `spacedome.netlify.app` en `*--spacedome.netlify.app` (staging en previews); bij livegang het echte domein toevoegen.

## Privacy, toegankelijkheid en SEO

- Geen cookies, geen tracking. `localStorage` alleen voor thema, wachtrij en speelpositie (functioneel).
- Fonts self-hosted (geen Google-verzoeken). Video komt van een externe streamingdienst (nu Mux-teststreams).
- WCAG 2.2 AA: skiplink, focus-states, player volledig met toetsenbord, `aria-live` voor de player, `prefers-reduced-motion` en `prefers-contrast` gerespecteerd.
- SEO volgens `~/Code/_standards/SEO.md`: meta, OG, JSON-LD (Organization, WebSite), sitemap, `robots.txt`, `llms.txt`. **Staat op `noindex`** tot livegang (`src/settings.ts`).

## Deploy

- Netlify-site `spacedome` op het MIERAS-team: https://spacedome.netlify.app (admin: app.netlify.com/projects/spacedome). Later over naar Space Dome.
- Gekoppeld aan GitHub: `main` → productie (spacedome.netlify.app), `staging` → branch deploy (staging--spacedome.netlify.app), PR's → deploy preview. Werkwijze volgens `~/Code/_standards/DEPLOY.md`.
- Branch protection op `staging` en `main`: alleen via PR (0 reviews nodig), geen force-push, niet verwijderen. De repo is publiek: nooit geheimen committen.

## Bekende issues en afspraken

- Domein, muziekrechten en videohosting zijn open punten bij Space Dome (`docs/mail-intake.md`).
- Video-bescherming tegen downloaden: pas mogelijk met de streamingdienst (signed URLs, domeinbeperking).
- Nederlandse routes nog niet gebouwd.

---

Eigenaar: MIERAS · Wat er gedaan is: zie [`CHANGELOG.md`](CHANGELOG.md) · Werkafspraken voor ontwikkelaars en AI-agents: [`AGENTS.md`](AGENTS.md)
