# Changelog

Alle noemenswaardige wijzigingen aan dit project. Nieuwste bovenaan.
Format gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/).

Categorieën: **Toegevoegd**, **Gewijzigd**, **Opgelost**, **Verwijderd**, **Beveiliging**, **Onderhoud**.

## [Unreleased]

### Toegevoegd
- Home in Sanity (vast document `home`, NL/EN): titel en intro van de hero zijn bewerkbaar, ook via de preview. Bovenaan in de Studio; teksten uit de code als terugval.
- Content live uit Sanity: alle pagina's lezen via `loadQuery()` met GROQ-queries en TypeGen-types (`src/lib/sanity/`). De site draait server-rendered op Netlify (`output: 'server'`, `@astrojs/netlify`); `getStaticPaths` en content collections zijn weg, onbekende slugs geven de 404.
- Presentation tool in de Studio (*Preview*): drafts met klikbare overlays, volgens `_standards/SANITY.md` §3. Ondertekende preview-cookie via `/api/preview`, alleen actief in de iframe van de Studio; eigen `VisualEditing` met history-adapter; volledige page loads in de preview (ClientRouter). Documenten gekoppeld aan URL's (`src/lib/sanity/resolve.ts`).
- CDN-cache: HTML blijft in de Netlify-CDN (tag `sanity`) tot een publicatie; `/api/revalidate` controleert de Sanity-webhook (`SANITY_WEBHOOK_SECRET`) en leegt de cache (`@netlify/cache`). Met preview-cookie `private, no-store`.
- Eigen `sitemap-index.xml` uit Sanity (leeg zolang `noindex` aan staat); `@astrojs/sitemap` eruit.
- Site-instellingen (naam, tagline, omschrijving, socials, noindex) uit Sanity, met `src/settings.ts` als terugval.
- Sanity (project `6fcexd1b`, dataset `production`): Studio ingebouwd op `/admin` (`@sanity/astro`, hash-router, geen adapter nodig), schema's voor set, dj, genre, page en site-instellingen, Studio-indeling Sets · DJ's · Genres · Pagina's · Site-instellingen. NL/EN per veld met `sanity-plugin-internationalized-array` (Engels verplicht). TypeGen (`npm run typegen`) en een herhaalbaar migratiescript (`npm run sanity:migrate`) dat alle Markdown-content overzet: 26 documenten, alle geldig.
- `docs/plan.md`: projectplan met scope, contentmodel, fases en de rendering-aanpak (SSR op Netlify, CDN-cache met cache-tags, purge via Sanity-webhook). Briefingmail aan Space Dome in `docs/mail-briefing.md`. `docs/` staat voortaan in `.gitignore` (de repo is publiek); de map blijft lokaal.
- Gegenereerde covers bewegen: de lichtbollen drijven, de kleur schuift mee en de ring (dome) zweeft en ademt; tempo en startpunt per seed, ring zet aan bij hover. Alleen CSS (`@property`), niet bij echte stills of `prefers-reduced-motion`.
- Knoppen: position-aware hover (GSAP), een cirkel vult de knop vanaf de muis en rolt eruit waar je weggaat. Naar CodePen OJYywaJ. Niet op touch of bij reduced motion.
- Home: de intro ("Recorded live in the dome") blijft op desktop staan tot de hero voorbij is.
- Peak-configurator op `/brand#peak`: palet (pink, sunset, magenta, rainbow), kolommen, blur, piek, dal, afval en overlap met schuifjes, live preview, "Try in footer" op de pagina zelf en de instelling om te plakken. Geometrie en paletten staan nu in `src/lib/peak.ts` (`PEAK_FOOTER` is de footer).
- `/brand`: interne stijlgids met logo, kleuren (rechtstreeks uit `tokens.scss`), type- en ruimteschaal, radii, iconen, knoppen, player-knoppen, chips, kaarten, carousel, tracklist en de effecten (reveal met replay, smear-speeltuin met schuifjes, peak gradient). Noindex en niet in de sitemap.
- Smear-effect instelbaar per element: `data-smear-amount`, `-shift`, `-spread`, `-duration`, `-dir`, `-ease`.
- Footer-test: peak gradient onderaan (geblurde kolommen in Space Dome-kleuren die oprijzen als de footer in beeld komt, `PeakGradient.astro`) en een smear-effect op de footerlinks (mono-kapitalen, tekst veegt bij hover/focus zijwaarts uit, `src/scripts/smear.ts`). Beide naar design.how/vault (MIT), zelf nagebouwd zonder externe bestanden. Niet bij `prefers-reduced-motion`.
- Flyers bij de drie avonden (Melkweg 14-07-2023 en 23-12-2023, De Nachtzuster 30-07-2026): op de avondpagina in eigen verhouding, in de lijst als thumbnail en als OG-beeld. Bronnen in `src/assets/events/`.
- Reveal-animatie bij het laden (GSAP 3.15 + SplitText): datum per teken, titel per woord, content-blokken en flyer schuiven zacht in. Op home, de avondpagina en de setpagina (titel, meta, dj's, knoppen, genres, tabs; de video zelf niet vanwege de docking). Niet bij `prefers-reduced-motion`; zonder JS gewoon zichtbaar.
- Home: knoppen "Browse all sets" (primary) en "About".
- Mini-video versleepbaar: loslaten zet hem links of rechts onderin (onthouden). Ook via een wisselknop, zonder slepen.
- Set van Ono-Sendai Sound (STACK/READY, via Bunny).
- "You might also like" als horizontale carousel: swipen/scrollen met scroll-snap, pijlknoppen voor muis en toetsenbord. Aangevuld tot 10 sets (eerst verwant, dan nieuwste).
- Footer: aantallen bij Sets, DJs, Genres en Events, en een eigen kolom met de meest gespeelde genres.
- De eerste twee Space Dome-avonden in Melkweg (14-07-2023 en 23-12-2023) met line-up; nieuwe dj-pagina's voor Mono/Poly, Kutmah, Cintasoul, Cheyanne Hudson, Odaira en Sunny Saimuns.

### Gewijzigd
- Hero-kop breekt niet meer midden in een woord ("RECORDE/D"): de grootte volgt de breedte van de intro-kolom (`cqi`) en het langste woord, in plaats van de schermbreedte.
- Migratiescript meldt welke documenten nieuw zijn (de teller telde alles mee).
- Migratiescript maakt standaard alleen ontbrekende documenten aan (`createIfNotExists`), zodat Studio-wijzigingen blijven staan; `--force` overschrijft.
- Security-headers ook op server-pagina's (middleware); `netlify.toml` start geen build meer bij wijzigingen in het Markdown-archief.
- Footer: peak gradient met hoger dal (0.76) en een lagere, vlakkere start.
- Scope: de site is alleen voor Space Dome FM. Tagline, omschrijving en home-intro spreken van radioshows en sets in plaats van avonden. README, DESIGN en AGENTS bijgewerkt.
- Setkaarten: datum/locatie (`--step--2`) en dj's (`--step--1`) een stuk kleiner, zodat de titel de kaart draagt.
- Fonts: Stack Sans-familie, self-hosted via Fontsource 5.3.0. Notch voor de grote titels (`--font-display`), Headline voor koppen (`--font-heading`), Text voor tekst. Unbounded blijft alleen voor het logo (`--font-logo`); Hanken Grotesk eruit.
- Titels flink groter voor meer contrast met de tekst: hero tot `step-8`, paginakop en dj tot `step-8`, settitel `step-7`, avondtitel `step-5`, h1 `step-6`, h2 `step-4`.
- Footer-peak: geen schalen meer. Tijdens het scrollen mengt de vorm zelf van een startstand (vlakke band: falloff 0, lage valley, iets gezakt, dof) naar de eindstand (falloff 2,17, valley 0,45, blur 35), per frame herberekend in `src/scripts/peak.ts` (alleen in beeld, rAF). Zonder JS of bij reduced motion: de eindstand. Werkt nu ook in Firefox.
- Peak-configurator op /brand: Start en End als tabs (preview springt naar de gekozen stand), scrubber en een play-knop van Start naar End.
- Tab-stijlen (`.tabs__*`) zijn globaal (components.scss); `sd-tabs` stuurt `tabs:change`.
- Footer-peak bloeit nu open: rustig (laag, smal, dof) als de footer in beeld komt, volle bloei helemaal onderaan (ease-in), weer rustig bij terugscrollen. Eindstand: magenta, 10 kolommen, blur 35, piek 0,84, dal 0,45, afval 2,17, overlap 2. View timeline negeert nu de scroll-padding, zodat onderaan echt 100% gehaald wordt.
- Peak-configurator: groep "Calm" (hoogte, breedte, dekking, verzadiging) en een scroll-preview van rustig naar bloei.
- Peak gradient in de footer: roze/paars palet (indigo vloer, violet, magenta, zachtroze kern) in plaats van de regenboog, en gekoppeld aan het scrollen (CSS scroll-driven animation, geen JS): rijst op terwijl de footer in beeld schuift, zakt weer weg als je terugscrollt. Zonder ondersteuning (Firefox) of bij reduced motion staat hij er gewoon.
- Smear-effect ook op titels (uitgelichte set, setkaarten, avondkaarten, dj-kaarten) in plaats van de hover-underline; hover op de hele kaart telt. Filter staat nu globaal in `BaseLayout`, `.badge` is een globale stijl.
- Home-hero: intro bovenaan uitgelijnd met de video.
- Avondpagina: datum nog kleiner (step-4), titel step-3. Flyer in eigen verhouding (`ratio="auto"` in CoverArt).
- Setpagina (desktop): de video blijft sticky staan terwijl je door beschrijving en tracklist scrolt, en wordt een mini-video als de content op is. Gedockte video plakt via CSS anchor positioning aan het podium (fallback: JS).
- Setpagina: op desktop video en info naast elkaar in de hero (video ~2/3, info ~1/3); op mobiel onder elkaar. Beschrijving en tracklist als tabs (WAI-ARIA, pijltjes/Home/End); zonder JS of met maar één van beide gewoon onder elkaar. Tracklist reageert op de kolombreedte (container query).
- Mini-video op telefoon groter (ruim de helft van de schermbreedte).
- Audiomodus laadt alleen de laagste videokwaliteit (240p): ongeveer 5× minder data. Terug naar video schakelt direct op.
- Set van Drvg Cvltvre gepubliceerd (was draft) en featured bovenaan home ("Featured set").
- Play-knop met tekst: gewoon "Play"/"Pause", even breed (geen verspringen).

### Opgelost
- /brand: kier tussen header en de sticky sectiebalk weg (balk sluit direct aan, zelfde glasachtergrond over de volle breedte). Op mobiel één horizontaal scrollende rij in plaats van drie regels. Ankers springen nu naar net onder die balk (scroll-margin op de titels), en de secties hebben meer ruimte (`--space-3xl`).
- /brand#peak: de sticky preview schoof over het codeblok (en de play-knop over de code). Preview en schuifjes zitten nu in een eigen blok, het codeblok eronder.
- Bunny-still die nog niet klaar is (of geweigerd wordt) gaf een kapot-plaatje-icoon; nu blijft de gegenereerde art staan.
- Op mobiel kon je na "alleen audio" niet meer terug naar video: de knop in de balk blijft nu staan (als camera-icoon).

### Onderhoud
- Netlify gekoppeld aan GitHub: `main` is productie, `staging` een branch deploy. README bijgewerkt.
- Branch protection op `staging` en `main` (PR verplicht, geen force-push of verwijderen).

### Verwijderd
- Avonden: `/events`, `EventCard`, de collectie `events`, flyers, het veld `event` op sets, venue in setkaarten en op de setpagina, MusicEvent-JSON-LD, de Events-sectie op home, in header, footer, `/brand` en `llms.txt`. De zes dj's die alleen in line-ups stonden (zonder sets) zijn ook weg.
- Smear-effect (titels, footerlinks, `/brand`-speeltuin, `src/scripts/smear.ts`, filter in `BaseLayout`). Footerlinks kleuren nu naar de accentkleur bij hover.

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
