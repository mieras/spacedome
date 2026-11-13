# Changelog

Alle noemenswaardige wijzigingen aan dit project. Nieuwste bovenaan.
Format gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/).

Categorieën: **Toegevoegd**, **Gewijzigd**, **Opgelost**, **Verwijderd**, **Beveiliging**, **Onderhoud**.

## [Unreleased]

### Toegevoegd
- Reveal-animatie bij het laden (GSAP 3.15 + SplitText): datum per teken, titel per woord, content-blokken en flyer schuiven zacht in. Op home en de avondpagina. Niet bij `prefers-reduced-motion`; zonder JS gewoon zichtbaar.
- Home: knoppen "Browse all sets" (primary) en "About".
- Mini-video versleepbaar: loslaten zet hem links of rechts onderin (onthouden). Ook via een wisselknop, zonder slepen.
- Set van Ono-Sendai Sound (STACK/READY, via Bunny).
- "You might also like" als horizontale carousel: swipen/scrollen met scroll-snap, pijlknoppen voor muis en toetsenbord. Aangevuld tot 10 sets (eerst verwant, dan nieuwste).
- Footer: aantallen bij Sets, DJs, Genres en Events, en een eigen kolom met de meest gespeelde genres.
- De eerste twee Space Dome-avonden in Melkweg (14-07-2023 en 23-12-2023) met line-up; nieuwe dj-pagina's voor Mono/Poly, Kutmah, Cintasoul, Cheyanne Hudson, Odaira en Sunny Saimuns.

### Gewijzigd
- Home-hero: intro bovenaan uitgelijnd met de video.
- Avondpagina: datum nog kleiner (step-4), titel step-3. Flyer in eigen verhouding (`ratio="auto"` in CoverArt).
- Setpagina (desktop): de video blijft sticky staan terwijl je door beschrijving en tracklist scrolt, en wordt een mini-video als de content op is. Gedockte video plakt via CSS anchor positioning aan het podium (fallback: JS).
- Setpagina: op desktop video en info naast elkaar in de hero (video ~2/3, info ~1/3); op mobiel onder elkaar. Beschrijving en tracklist als tabs (WAI-ARIA, pijltjes/Home/End); zonder JS of met maar één van beide gewoon onder elkaar. Tracklist reageert op de kolombreedte (container query).
- Mini-video op telefoon groter (ruim de helft van de schermbreedte).
- Audiomodus laadt alleen de laagste videokwaliteit (240p): ongeveer 5× minder data. Terug naar video schakelt direct op.
- Set van Drvg Cvltvre gepubliceerd (was draft) en featured bovenaan home ("Featured set").
- Play-knop met tekst: gewoon "Play"/"Pause", even breed (geen verspringen).

### Opgelost
- Bunny-still die nog niet klaar is (of geweigerd wordt) gaf een kapot-plaatje-icoon; nu blijft de gegenereerde art staan.
- Op mobiel kon je na "alleen audio" niet meer terug naar video: de knop in de balk blijft nu staan (als camera-icoon).

### Onderhoud
- Netlify gekoppeld aan GitHub: `main` is productie, `staging` een branch deploy. README bijgewerkt.
- Branch protection op `staging` en `main` (PR verplicht, geen force-push of verwijderen).

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
