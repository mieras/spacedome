# Changelog

Alle noemenswaardige wijzigingen aan dit project. Nieuwste bovenaan.
Format gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/).

Categorieën: **Toegevoegd**, **Gewijzigd**, **Opgelost**, **Verwijderd**, **Beveiliging**, **Onderhoud**.

## [Unreleased]

## [2026-11-13]

### Toegevoegd
- Eerste versie op Astro 7.4 met Markdown-content (sets, dj's, genres, avonden, about).
- Site-brede player met `transition:persist`: speelt door tijdens navigeren, dockt over het podium op de setpagina en wordt een mini-video elders. Wachtrij, speelpositie en audio-only in `localStorage`, Media Session, delen op tijdstip (`?t=`).
- Suggesties op basis van dj, genre en avond.
- Gegenereerde cover-art per set als er nog geen still is.
- Design-tokens met Utopia (type en space) en OKLCH `light-dark()`, light/dark-toggle, `DESIGN.md`.
- SEO: meta, OG, JSON-LD, sitemap, `robots.txt`, `llms.txt` (site staat op `noindex` tot livegang).
- Intake-mail met open punten (`docs/mail-intake.md`).
- `npm run set:add`: set toevoegen vanuit STACK (map READY) via Bunny Stream, zonder CMS. Bunny haalt de video zelf op; het script maakt het Markdown-bestand aan.
- Bunny-thumbnail als still van een set (cover, kaart, player) als er geen eigen poster is.
- Testset `stack-test` met een korte echte opname, nu via Bunny Stream (de mp4 is uit de repo).

### Gewijzigd
- Video van de uitgelichte set speelt in het hero-podium op de home en zweeft rechtsonder als je wegscrollt.
- Tagline, hero- en about-tekst neutraal gemaakt (placeholder): "Low End Theory" is inspiratie, geen slogan.

### Opgelost
- Horizontaal scrollen op mobiel: te grote datum op de avondpagina, te grote titels (hero, set, dj, genre) en de gloed achter de hero die buiten de pagina viel. Getest op 320–1024px zonder overflow (WCAG 1.4.10).
- Bij elke paginawissel startte er een extra player met een onzichtbare video die meespeelde; daardoor liepen meerdere sets door elkaar en klopte de balk niet meer. De player start nu echt maar één keer.
- Video bleef verborgen na de eerste keer afspelen (docken gebeurde voor de bron gekoppeld was).

### Onderhoud
- Env-namen voor Bunny Stream (CDN-hostnaam, API-key) en STACK toegevoegd aan `.env.example` en de README.
- Netlify-site `spacedome` aangemaakt op het MIERAS-team; eerste deploy staat op spacedome.netlify.app (noindex).
- Node 22.23.5 vastgezet (`.nvmrc`, `netlify.toml`): Astro 7.4 vraagt ≥ 22.23.4.
