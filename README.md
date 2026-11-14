# spacedome

> Site voor Space Dome FM: radioshows en DJ-sets uit de LA beat scene kijken en luisteren, met een player die site-breed doorspeelt, plus dj's en genres. De losse avonden (Melkweg, De Nachtzuster) vallen erbuiten. Plan: `docs/plan.md` (lokaal, niet in git).

| | |
|---|---|
| **Klant** | Space Dome (vriendendienst) |
| **Bedrijf** | MIERAS |
| **Status** | WIP · content live uit Sanity (SSR op Netlify, CDN-cache), Studio met preview op `/admin` |
| **SLA** | Nee |
| **Live** | TODO (domein nog niet gekozen, spacedome.xyz is niet beschikbaar; zie `docs/mail-intake.md`) |
| **Netlify** | team MIERAS, site `spacedome` (later naar het account van Space Dome) |
| **CMS** | Sanity, project `6fcexd1b` (Space Dome), dataset `production`, op het MIERAS-account (later overdragen). Studio met Presentation (live preview van drafts): `/admin` |
| **Repo** | [github.com/mieras/spacedome](https://github.com/mieras/spacedome) |
| **Notion** | Repo-overzicht (privé) |

## Stack

- Astro 7.4 · Node 22.23.5 (`.nvmrc`) · server-rendered op Netlify (`@astrojs/netlify`), pagina's in de Netlify-CDN
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

Overige scripts: `npm run build`, `npm run preview`, `npm run check`, `npm run typegen` (types uit schema en queries, na elke schemawijziging), `npm run sanity:migrate` (Markdown → Sanity, `-- --dry-run` eerst).

Studio: http://localhost:4321/admin (inloggen met je Sanity-account).

### Testvideo

De set `stack-test` speelt `public/media/stack-test.mp4` (8,6 MB): een korte opname uit de STACK-map van Space Dome. Tijdelijk; straks komen video's uit Bunny Stream en gaat dit bestand uit git.

### Environment-variabelen

Zonder `.env` werkt de site (projectgegevens staan als terugval in de config; gepubliceerde content is openbaar leesbaar). Tokens alleen voor preview, cache legen en scripts; namen in `.env.example`.

| Naam | Waarvoor | Waar te vinden |
|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Sanity-project (`6fcexd1b`) | sanity.io/manage |
| `PUBLIC_SANITY_DATASET` | Dataset (`production`) | sanity.io/manage |
| `SANITY_API_READ_TOKEN` | Drafts in de Presentation tool en ondertekenen van de preview-cookie (rol Viewer), geheim. Op Netlify voor Production, Deploy previews en Branch deploys | sanity.io/manage → API → Tokens |
| `SITE_STATUS` | Optioneel, noodknop: `live`, `comingSoon` of `maintenance` wint van Sanity. Wordt bij de build ingebakken, dus na wijzigen opnieuw deployen | Zelf zetten op Netlify (per context) |
| `SANITY_WEBHOOK_SECRET` | Controleert de webhook die na publiceren de CDN leegt (`/api/revalidate`), geheim. Alleen op Netlify | Zelf kiezen; zelfde waarde in de Sanity-webhook |
| `SANITY_API_WRITE_TOKEN` | Migratiescript (rol Editor/Developer), geheim, alleen lokaal. Intrekken na de migratie | sanity.io/manage → API → Tokens |
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
  content/      Markdown-archief: bron voor sanity:migrate en set:add, niet meer voor de site
  i18n/         Interfaceteksten (EN, NL in voorbereiding)
  layouts/      BaseLayout (head, header, footer, player)
  lib/          Datalaag (content.ts), sanity/ (queries, loadQuery, preview, Presentation-resolve), art, format, seo
  middleware.ts Preview aan/uit per verzoek, CDN-cache-headers
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
- **Statuspagina** (`/coming-soon`): Site-instellingen → *Status* in Sanity. Live, Coming soon of Onderhoud, met een **aparte schakelaar voor de live site (main) en voor staging/previews** (zelfde dataset, dus anders zou staging de live site raken). Welke geldt, bepaalt de build via Netlify's `CONTEXT` (`production` = main). Niet op Live: elke pagina toont de statuspagina (onderhoud met 503 en `Retry-After`); de Studio, `/api`, `robots.txt`, sitemap en `llms.txt` blijven bereikbaar. Wie in de Studio de *Preview* opent, krijgt een cookie en ziet 12 uur lang de hele site, ook in een gewoon tabblad. Titel, tekst en countdown optioneel; bij nul staat er "Any moment now", live gaan blijft een handmatige stap. Bekijken zonder iets aan te zetten: `/coming-soon` en `/coming-soon?mode=maintenance`. Omschakelen werkt pas direct als de webhook de CDN leegt (zie Deploy).
- **Home** (Sanity, één vast document): titel en intro van de hero. De uitgelichte set kies je met *Uitgelicht* op een set.
- De content is **dummy** (fictieve dj's), behalve de sets van Drvg Cvltvre en Ono-Sendai Sound en de about-tekst (die gaat nog over de avonden; nieuwe tekst voor FM komt van Space Dome).
- **Bron is Sanity.** Pagina's lezen alleen via `src/lib/content.ts`, die via `loadQuery()` (`src/lib/sanity/`) GROQ-queries draait (`queries.ts`, types uit TypeGen). Lege velden worden `undefined`; stega (onzichtbare tekens voor de preview) blijft alleen op zichtbare tekst.
- **Rendering:** elke pagina wordt op verzoek gerenderd en daarna door de Netlify-CDN bewaard (`Netlify-CDN-Cache-Control`, tag `sanity`). Na publiceren roept een Sanity-webhook `/api/revalidate` aan, die de hele cache leegt (header en footer tonen alle genres en tellingen, dus vrijwel elke pagina hangt van alle content af). Geen rebuild nodig.
- **Preview:** Studio → *Preview* (Presentation tool) toont drafts met klikbare overlays, volgens `~/Code/_standards/SANITY.md` §3. `/api/preview` zet een ondertekende cookie; de middleware zet preview alleen aan met die cookie én in de iframe van de Studio. Met de cookie wordt niets gecachet.
- **Sanity:** schema's in `schema/` (set, dj, genre, page, siteSettings), Studio-indeling in `schema/structure.ts`, config in `sanity.config.ts`. Vertaalbare tekst per veld met `sanity-plugin-internationalized-array` (v5: taal in `language`); Engels is verplicht, Nederlands optioneel. Talen in `src/lib/talen.ts`. Gegenereerde types: `sanity.types.ts` en `sanity.schema.json` (committen).
- `scripts/migrate-to-sanity.ts` zette de Markdown over (vaste ID's `set-<slug>`, `dj-<slug>`, `genre-<slug>`, `page-<slug>`, `siteSettings`). Het maakt standaard alleen ontbrekende documenten aan; bestaande (ook wat in de Studio is aangepast) blijven staan. `-- --force` overschrijft alles met Markdown.

### Set toevoegen

Sander zet de afgemonteerde opname in STACK, map **READY**, en stuurt de gegevens (titel, dj's, genres, tracklist). Dan:

```bash
npm run set:add            # kies een video uit STACK/READY en beantwoord de vragen
npm run set:add -- --list  # alleen kijken wat er staat (✓ = al op de site)
```

Het script (`scripts/set-add.mjs`) laat Bunny Stream de video zelf uit STACK ophalen (server naar server), maakt `src/content/sets/<slug>.md` aan (plus nieuwe dj's/genres) en wacht tot Bunny klaar is met coderen. Daarna `npm run sanity:migrate` (zet alleen de nieuwe documenten in Sanity) en tracklist en beschrijving aanvullen in de Studio. Het script schrijft nog Markdown; rechtstreeks naar Sanity is een open punt.

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
- Content staat los van deploys: publiceren in Sanity leegt de CDN via de webhook. Wijzigingen in `src/content/` of docs starten geen build (`netlify.toml` → `ignore`).
- **Sanity-webhook** (sanity.io/manage → API → Webhooks): GROQ, create/update/delete, filter `_type in ["set", "dj", "genre", "page", "siteSettings"] && !(_id in path("drafts.**"))`, projectie `{ _type, _id }`, POST naar `https://<site>/api/revalidate`, secret = `SANITY_WEBHOOK_SECRET`. Voor productie en staging een eigen webhook.
- Branch protection op `staging` en `main`: alleen via PR (0 reviews nodig), geen force-push, niet verwijderen. De repo is publiek: nooit geheimen committen.

## Bekende issues en afspraken

- Domein, muziekrechten en videohosting zijn open punten bij Space Dome (`docs/mail-intake.md`).
- Video-bescherming tegen downloaden: pas mogelijk met de streamingdienst (signed URLs, domeinbeperking).
- Nederlandse routes nog niet gebouwd.

---

Eigenaar: MIERAS · Wat er gedaan is: zie [`CHANGELOG.md`](CHANGELOG.md) · Werkafspraken voor ontwikkelaars en AI-agents: [`AGENTS.md`](AGENTS.md)
