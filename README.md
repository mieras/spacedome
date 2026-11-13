# spacedome

> Site voor Space Dome: DJ-sets uit de LA beat scene kijken en luisteren, met een player die site-breed doorspeelt, plus dj's, genres en avonden.

| | |
|---|---|
| **Klant** | Space Dome (vriendendienst) |
| **Bedrijf** | MIERAS |
| **Status** | WIP · eerste versie op Markdown-content, Sanity volgt |
| **SLA** | Nee |
| **Live** | TODO (domein nog niet gekozen, spacedome.xyz is niet beschikbaar; zie `docs/mail-intake.md`) |
| **Netlify** | team MIERAS, site TODO (later naar het account van Space Dome) |
| **CMS** | Nog geen: Markdown in `src/content/`. Later Sanity (eerst MIERAS-account, daarna overdragen) |
| **Repo** | [github.com/mieras/spacedome](https://github.com/mieras/spacedome) |
| **Notion** | Repo-overzicht (privé) |

## Stack

- Astro 7.4 · Node 22.23.5 (`.nvmrc`) · statisch
- Styling: SCSS met `utopia-core-scss` (fluid type en space), OKLCH-tokens met `light-dark()`, cascade layers
- Fonts: Unbounded + Hanken Grotesk, self-hosted via Fontsource
- Video: HLS via hls.js (Safari native). Nu teststreams van Mux; straks Bunny Stream
- Animatie: CSS + View Transitions (`<ClientRouter />`), geen GSAP
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
  content/      Markdown: sets, djs, genres, events, pages
  i18n/         Interfaceteksten (EN, NL in voorbereiding)
  layouts/      BaseLayout (head, header, footer, player)
  lib/          Datalaag (content.ts), art, format, seo
  pages/        Routes
  scripts/      player.ts (site-brede player), share.ts
  styles/       tokens.scss (Utopia + kleur), layout, base, player
docs/           Intake-mail en notities
DESIGN.md       Ontwerpsysteem
```

## Content en CMS

- **Sets:** titel, omschrijving (body), datum, dj's, genres, avond (optioneel, leeg = losse set), video (`src` + `duration`), still (`poster`), tracklist (artiest, titel, label, optioneel tijd).
- **DJs:** naam, plaats, resident, foto, links, bio (body).
- **Genres:** titel, omschrijving.
- **Events:** titel, start/eind, locatie, poster, RA-link, line-up, tekst (body).
- **Pages:** about.
- Schema: `src/content.config.ts`. De Markdown-content is **dummy** (fictieve dj's), behalve de avond van 30-07-2026 en de about-tekst.
- Overstap naar Sanity volgens `~/Code/_standards/SANITY-MIGRATIE.md`; alle pagina's lezen via `src/lib/content.ts`.

## Privacy, toegankelijkheid en SEO

- Geen cookies, geen tracking. `localStorage` alleen voor thema, wachtrij en speelpositie (functioneel).
- Fonts self-hosted (geen Google-verzoeken). Video komt van een externe streamingdienst (nu Mux-teststreams).
- WCAG 2.2 AA: skiplink, focus-states, player volledig met toetsenbord, `aria-live` voor de player, `prefers-reduced-motion` en `prefers-contrast` gerespecteerd.
- SEO volgens `~/Code/_standards/SEO.md`: meta, OG, JSON-LD (Organization, WebSite, MusicEvent), sitemap, `robots.txt`, `llms.txt`. **Staat op `noindex`** tot livegang (`src/settings.ts`).

## Deploy

- Netlify-site `spacedome` op het MIERAS-team: https://spacedome.netlify.app (admin: app.netlify.com/projects/spacedome). Later over naar Space Dome.
- De eerste deploys zijn handmatig gedaan vanaf `staging` (`netlify deploy --prod --dir dist`). De GitHub-repo moet nog gekoppeld worden in Netlify.
- Na het koppelen: `main` → productie, `staging` → branch deploy (staging--spacedome.netlify.app), PR's → deploy preview (zie `~/Code/_standards/DEPLOY.md`).

## Bekende issues en afspraken

- Domein, muziekrechten en videohosting zijn open punten bij Space Dome (`docs/mail-intake.md`).
- Video-bescherming tegen downloaden: pas mogelijk met de streamingdienst (signed URLs, domeinbeperking).
- Nederlandse routes nog niet gebouwd.

---

Eigenaar: MIERAS · Wat er gedaan is: zie [`CHANGELOG.md`](CHANGELOG.md) · Werkafspraken voor ontwikkelaars en AI-agents: [`AGENTS.md`](AGENTS.md)
