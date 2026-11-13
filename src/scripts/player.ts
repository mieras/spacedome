/*
 * Site-brede player.
 *
 * Logica in het kort:
 * - Het <sd-player>-element staat met transition:persist in de layout. Astro verplaatst het bij
 *   een paginawissel naar de nieuwe pagina zonder het uit het document te halen, dus de video
 *   speelt door. Dit script draait daarom maar één keer; per pagina doen we alleen
 *   "opnieuw koppelen" (knoppen bijwerken, podium zoeken) in astro:after-swap / astro:page-load.
 *   Let op: de module-vlag `started` bewaakt dat; een vlag op het element werkt niet (zie init).
 * - Bediening via data-attributen: [data-player-play], [data-player-queue] (overal op de site)
 *   en de knoppen in de balk. Eén click-handler op het document.
 * - Video-modus: "docked" over het podium van de spelende set ([data-player-stage]), "mini"
 *   onderin als je elders bent of het podium uit beeld scrolt, "hidden" bij alleen audio.
 *   Gedockt zetten we de video absoluut in documentcoördinaten: hij scrollt dan vanzelf mee,
 *   zonder scroll-listener. Wisselen tussen docked en mini animeren we met FLIP.
 * - HLS (.m3u8): Safari en iOS spelen het native af; elders laden we hls.js pas als het nodig is.
 * - Toestand (huidige set, positie, wachtrij, audio/video, mute) staat in localStorage.
 */
import type HlsType from 'hls.js';
import { t } from '../i18n/ui';
import type { PlayerItem } from '../lib/content';
import { share, toast } from './share';

type View = 'video' | 'audio';
type Mode = 'off' | 'docked' | 'mini' | 'hidden';
type Side = 'left' | 'right';
type Saved = { current: PlayerItem | null; position: number; queue: PlayerItem[]; view: View; muted: boolean; side: Side };

const STORAGE_KEY = 'spacedome:player';
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Safari/iOS: native HLS (zuiniger, AirPlay). Elders hls.js, ook als de browser "maybe" zegt. */
const preferNativeHls = () => /^((?!chrome|chromium|android|crios|fxios).)*safari/i.test(navigator.userAgent);

/* ---------- Opslag ---------- */

function read(): Saved {
  const fallback: Saved = { current: null, position: 0, queue: [], view: 'video', muted: false, side: 'right' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

/* ---------- Helpers ---------- */

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function parseItem(el: HTMLElement): PlayerItem | null {
  try {
    return JSON.parse(el.dataset.item ?? '');
  } catch {
    return null;
  }
}

// Moduleniveau, niet op het element: bij een swap zet Astro eerst de nieuwe <body> (met een
// verse, lege <sd-player>) in het document en pas daarna het oude element terug. Die verse
// speler triggert connectedCallback; zonder deze vlag startte elke paginawissel een extra
// player met eigen handlers en een eigen (losgekoppelde) video die onzichtbaar meespeelde.
let started = false;

function init(found: HTMLElement) {
  if (started) return;
  started = true;
  const root: HTMLElement = found;
  root.dataset.ready = '';

  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const media = $('[data-player-media]');
  const video = $<HTMLVideoElement>('[data-player-video]');
  const bar = $('[data-player-bar]');
  const link = $<HTMLAnchorElement>('[data-player-link]');
  const openLink = $<HTMLAnchorElement>('[data-player-open]');
  const thumb = $('[data-player-thumb]');
  const titleEl = $('[data-player-title]');
  const artistsEl = $('[data-player-artists]');
  const toggleBtn = $<HTMLButtonElement>('[data-player-toggle]');
  const seek = $<HTMLInputElement>('[data-player-seek]');
  const currentEl = $('[data-player-current]');
  const durationEl = $('[data-player-duration]');
  const muteBtn = $<HTMLButtonElement>('[data-player-mute]');
  const viewBtn = $<HTMLButtonElement>('[data-player-view]');
  const moveBtn = $<HTMLButtonElement>('[data-player-move]');
  const queueToggle = $<HTMLButtonElement>('[data-player-queue-toggle]');
  const queueCount = $('[data-player-queue-count]');
  const queuePanel = $('[data-player-queue-panel]');
  const queueHeading = $('[data-player-queue-heading]');
  const queueList = $('[data-player-queue-list]');
  const queueEmpty = $('[data-player-queue-empty]');
  const status = $('[data-player-status]');

  const saved = read();
  const state = {
    current: saved.current,
    position: saved.position,
    queue: saved.queue,
    view: saved.view,
    side: saved.side,
  };
  video.muted = saved.muted;

  let hls: HlsType | null = null;
  let attachedId: string | null = null;
  let seeking = false;
  let lastSave = 0;

  const save = () => {
    try {
      const position = attachedId ? Math.floor(video.currentTime) : state.position;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, position, muted: video.muted } satisfies Saved));
    } catch {}
  };
  const announce = (msg: string) => {
    status.textContent = '';
    requestAnimationFrame(() => (status.textContent = msg));
  };
  const duration = () => (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : state.current?.duration ?? 0);
  const isPlaying = () => !!attachedId && !video.paused && !video.ended;

  /* ---------- Bron koppelen ---------- */

  async function attach(item: PlayerItem) {
    if (attachedId === item.id) return;
    hls?.destroy();
    hls = null;
    video.removeAttribute('src');
    const isHls = /\.m3u8(\?|$)/i.test(item.src);
    if (isHls && !preferNativeHls()) {
      const { default: Hls } = await import('hls.js');
      if (Hls.isSupported()) {
        const instance = new Hls({ capLevelToPlayerSize: true });
        instance.loadSource(item.src);
        instance.attachMedia(video);
        hls = instance;
        instance.on(Hls.Events.MANIFEST_PARSED, () => applyQuality());
        instance.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) toast('This set could not be loaded.');
        });
      } else {
        video.src = item.src;
      }
    } else {
      video.src = item.src;
    }
    attachedId = item.id;
  }

  /**
   * Audiomodus: alleen de laagste rendition (240p, ~0,4 Mbit/s in plaats van ~2 bij 720p).
   * Bunny levert audio en video samen in één stream, dus helemaal zonder beeld kan niet.
   * hls.js sorteert levels op bitrate, dus index 0 is de lichtste. Safari (native HLS) kiest zelf.
   */
  function applyQuality(switching = false) {
    if (!hls) return;
    const audio = state.view === 'audio';
    hls.autoLevelCapping = audio ? 0 : -1;
    // Terug naar video: de gebufferde 240p weggooien en meteen de beste passende kwaliteit laden.
    if (switching && !audio) hls.nextLevel = -1;
  }

  function seekWhenReady(time: number) {
    if (!time) return;
    if (video.readyState >= 1) video.currentTime = time;
    else video.addEventListener('loadedmetadata', () => (video.currentTime = time), { once: true });
  }

  /* ---------- Acties ---------- */

  async function play(item: PlayerItem, start?: number) {
    const isNew = state.current?.id !== item.id;
    state.current = item;
    state.queue = state.queue.filter((q) => q.id !== item.id);
    if (isNew) state.position = start ?? 0;
    else if (start !== undefined) state.position = start;
    render();
    if (isNew) connectStage();
    dock(true);
    if (attachedId !== item.id) {
      await attach(item);
      seekWhenReady(state.position);
      dock(true); // nu er een bron is, mag de video zichtbaar worden
    } else if (start !== undefined) {
      video.currentTime = start;
    }
    try {
      await video.play();
      announce(`${t('player.nowPlaying')}: ${item.title}, ${item.artists}`);
    } catch {
      render();
    }
    save();
  }

  async function resume() {
    if (state.current) await play(state.current);
  }

  function pause() {
    video.pause();
  }

  function toggle() {
    if (isPlaying()) pause();
    else resume();
  }

  function next() {
    const nextItem = state.queue.shift();
    if (nextItem) play(nextItem, 0);
    else {
      state.position = 0;
      render();
      save();
    }
  }

  function close() {
    video.pause();
    hls?.destroy();
    hls = null;
    attachedId = null;
    video.removeAttribute('src');
    video.load();
    state.current = null;
    state.position = 0;
    closeQueue();
    render();
    dock(false);
    save();
  }

  function toggleQueueItem(item: PlayerItem) {
    if (item.id === state.current?.id) {
      toast(`${t('player.nowPlaying')}: ${item.title}`);
      return;
    }
    const i = state.queue.findIndex((q) => q.id === item.id);
    if (i >= 0) {
      state.queue.splice(i, 1);
      announce(`${t('player.remove')}: ${item.title}`);
    } else {
      state.queue.push(item);
      toast(`${t('set.queued')}: ${item.title}`);
    }
    // Wachtrij zonder iets in de player? Toon de balk met het eerste item klaar om te spelen.
    if (!state.current && state.queue.length) state.current = state.queue.shift()!;
    render();
    dock(false);
    save();
  }

  function setView(view: View) {
    state.view = view;
    applyQuality(true);
    render();
    dock(true);
    save();
  }

  /* ---------- Wachtrijpaneel ---------- */

  function openQueue() {
    queuePanel.hidden = false;
    queueToggle.setAttribute('aria-expanded', 'true');
    queueHeading.focus();
  }
  function closeQueue(returnFocus = false) {
    if (queuePanel.hidden) return;
    queuePanel.hidden = true;
    queueToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) queueToggle.focus();
  }

  function renderQueue() {
    queueCount.hidden = state.queue.length === 0;
    queueCount.textContent = String(state.queue.length);
    queueToggle.setAttribute('aria-label', `${t('player.queue')} (${state.queue.length})`);
    queueEmpty.hidden = state.queue.length > 0;
    queueList.replaceChildren(
      ...state.queue.map((item) => {
        const li = document.createElement('li');
        li.className = 'player-queue__item';

        const art = document.createElement('span');
        art.className = 'art';
        art.setAttribute('aria-hidden', 'true');
        art.setAttribute('style', item.art);
        if (item.cover) {
          const img = document.createElement('img');
          img.src = item.cover;
          img.alt = '';
          art.append(img);
        }

        const text = document.createElement('span');
        text.className = 'player-queue__text';
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.title;
        const by = document.createElement('span');
        by.textContent = item.artists;
        text.append(a, by);

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'icon-button';
        playBtn.dataset.queuePlay = item.id;
        playBtn.setAttribute('aria-label', `${t('player.playNow')}: ${item.title}`);
        playBtn.innerHTML = toggleBtn.querySelector('.icon-play')!.outerHTML;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'icon-button';
        removeBtn.dataset.queueRemove = item.id;
        removeBtn.setAttribute('aria-label', `${t('player.remove')}: ${item.title}`);
        removeBtn.innerHTML = root.querySelector('[data-player-close] svg')!.outerHTML;

        li.append(art, text, playBtn, removeBtn);
        return li;
      }),
    );
  }

  /* ---------- Weergave ---------- */

  function renderTime() {
    const d = duration();
    const c = attachedId ? video.currentTime : state.position;
    if (!seeking) seek.value = String(Math.floor(c));
    seek.max = String(Math.floor(d));
    seek.style.setProperty('--_p', d ? `${(c / d) * 100}%` : '0%');
    seek.setAttribute('aria-valuetext', `${formatClock(c)} of ${formatClock(d)}`);
    currentEl.textContent = formatClock(c);
    durationEl.textContent = formatClock(d);
  }

  /** Alle play- en wachtrijknoppen op de pagina in de juiste stand. */
  function renderButtons() {
    const playing = isPlaying();
    document.querySelectorAll<HTMLElement>('[data-player-play]').forEach((btn) => {
      const mine = btn.dataset.id === state.current?.id;
      const st = mine ? (playing ? 'playing' : 'paused') : 'idle';
      btn.dataset.state = st;
      const title = parseItem(btn)?.title ?? '';
      const label = btn.querySelector('[data-play-label]');
      if (label) {
        if (!btn.dataset.labelIdle) btn.dataset.labelIdle = label.textContent ?? '';
        label.textContent = st === 'playing' ? t('set.pause') : btn.dataset.labelIdle;
      } else {
        btn.setAttribute('aria-label', `${st === 'playing' ? t('set.pause') : t('set.play')}: ${title}`);
      }
    });
    const queued = new Set(state.queue.map((q) => q.id));
    document.querySelectorAll<HTMLElement>('[data-player-queue]').forEach((btn) => {
      const inQueue = queued.has(btn.dataset.id ?? '');
      btn.setAttribute('aria-pressed', String(inQueue));
      const text = btn.querySelector('span');
      if (text) text.textContent = inQueue ? t('set.queued') : t('set.queue');
    });
    document.querySelectorAll<HTMLElement>('[data-now-playing]').forEach((el) => {
      el.hidden = !(el.dataset.nowPlaying === state.current?.id && playing);
    });
  }

  function render() {
    const item = state.current;
    root.hidden = !item;
    if (item) document.documentElement.dataset.player = 'on';
    else delete document.documentElement.dataset.player;

    if (item) {
      link.href = item.href;
      openLink.href = item.href;
      titleEl.textContent = item.title;
      artistsEl.textContent = item.artists;
      thumb.setAttribute('style', item.art);
      thumb.replaceChildren();
      if (item.cover) {
        const img = document.createElement('img');
        img.src = item.cover;
        img.alt = '';
        thumb.append(img);
      }
    }

    const playing = isPlaying();
    bar.dataset.state = playing ? 'playing' : 'paused';
    toggleBtn.dataset.state = playing ? 'playing' : 'paused';
    toggleBtn.setAttribute('aria-label', playing ? t('set.pause') : t('set.play'));
    muteBtn.setAttribute('aria-pressed', String(video.muted));
    // Label zegt wat de knop doet; op mobiel blijft hij in audiomodus zichtbaar als weg terug naar video.
    viewBtn.dataset.view = state.view;
    viewBtn.setAttribute('aria-label', state.view === 'audio' ? t('player.showVideo') : t('player.audioOnly'));
    renderSide();

    renderTime();
    renderQueue();
    renderButtons();
    renderMediaSession();
  }

  function renderMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const item = state.current;
    if (!item) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.title,
      artist: item.artists,
      album: 'Space Dome',
      artwork: item.cover ? [{ src: new URL(item.cover, location.origin).href }] : [], // webp (eigen poster) of jpg (Bunny-still)
    });
    navigator.mediaSession.playbackState = isPlaying() ? 'playing' : 'paused';
  }

  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => resume());
    ms.setActionHandler('pause', () => pause());
    ms.setActionHandler('seekbackward', () => (video.currentTime = Math.max(0, video.currentTime - 15)));
    ms.setActionHandler('seekforward', () => (video.currentTime = Math.min(duration(), video.currentTime + 30)));
    ms.setActionHandler('nexttrack', () => next());
    try {
      ms.setActionHandler('seekto', (d) => d.seekTime !== undefined && (video.currentTime = d.seekTime));
    } catch {}
  }

  /* ---------- Docken: podium op de setpagina of mini ---------- */

  let mode: Mode = 'off';
  let stage: HTMLElement | null = null;
  let stageVisible = false;
  let io: IntersectionObserver | null = null;
  let ro: ResizeObserver | null = null;

  function computeMode(): Mode {
    if (!state.current) return 'off';
    // Hersteld uit opslag maar nog niet gestart: alleen de balk, geen zwart vlak.
    if (state.view === 'audio' || !attachedId) return 'hidden';
    return stage && stageVisible ? 'docked' : 'mini';
  }

  function place(m: Mode) {
    media.dataset.mode = m;
    document.querySelectorAll('[data-player-docked]').forEach((el) => el.removeAttribute('data-player-docked'));
    if (m === 'docked' && stage) {
      const r = stage.getBoundingClientRect();
      media.style.cssText = `top:${r.top + scrollY}px;left:${r.left + scrollX}px;width:${r.width}px;height:${r.height}px`;
      stage.setAttribute('data-player-docked', '');
    } else {
      media.style.cssText = '';
    }
  }

  /** Nieuwe modus toepassen; met animate een FLIP van de oude naar de nieuwe plek. */
  function dock(animate: boolean) {
    const nextMode = computeMode();
    const visible = (m: Mode) => m === 'docked' || m === 'mini';
    const shouldAnimate = animate && !reducedMotion() && nextMode !== mode && visible(mode) && visible(nextMode);
    const first = shouldAnimate ? media.getBoundingClientRect() : null;
    place(nextMode);
    mode = nextMode;
    if (!first) return;
    const last = media.getBoundingClientRect();
    if (!last.width || !last.height) return;
    media.animate(
      [
        {
          transformOrigin: 'top left',
          transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`,
        },
        { transformOrigin: 'top left', transform: 'none' },
      ],
      { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }

  /** Per pagina: podium zoeken en observeren. */
  function connectStage() {
    io?.disconnect();
    ro?.disconnect();
    stage = state.current ? document.querySelector<HTMLElement>(`[data-player-stage="${CSS.escape(state.current.id)}"]`) : null;
    stageVisible = false;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const visibleHeight = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    stageVisible = visibleHeight > r.height * 0.4;

    io = new IntersectionObserver(
      ([entry]) => {
        const v = !!entry && entry.intersectionRatio > 0.4;
        if (v !== stageVisible) {
          stageVisible = v;
          dock(true);
        }
      },
      { threshold: [0, 0.4, 1] },
    );
    io.observe(stage);
    // Verschuift of verandert de pagina (fonts, beelden), dan het podium opnieuw meten.
    ro = new ResizeObserver(() => mode === 'docked' && place('docked'));
    ro.observe(stage);
    ro.observe(document.body);
  }

  addEventListener('resize', () => mode === 'docked' && place('docked'));

  /* ---------- Mini verslepen: links of rechts ---------- */
  // Slepen werkt met muis en vinger (pointer events). Loslaten = naar de dichtstbijzijnde kant.
  // De knop [data-player-move] doet hetzelfde zonder slepen (WCAG 2.5.7) en met het toetsenbord.

  function renderSide() {
    media.dataset.side = state.side;
    moveBtn.setAttribute('aria-label', state.side === 'right' ? t('player.moveLeft') : t('player.moveRight'));
  }

  function setSide(next: Side, from = media.getBoundingClientRect()) {
    state.side = next;
    renderSide();
    save();
    if (reducedMotion() || mode !== 'mini') return;
    const to = media.getBoundingClientRect();
    media.animate([{ translate: `${from.left - to.left}px ${from.top - to.top}px` }, { translate: '0 0' }], {
      duration: 350,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }

  let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  let suppressClick = false;

  media.addEventListener('pointerdown', (e) => {
    if (mode !== 'mini' || !e.isPrimary || e.button !== 0 || (e.target as Element).closest('a, button')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  media.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 8) return; // kleine beweging = gewoon een tik (play/pauze)
      drag.moved = true;
      media.setPointerCapture(e.pointerId);
      media.dataset.dragging = '';
    }
    media.style.translate = `${dx}px ${dy}px`;
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved } = drag;
    drag = null;
    if (!moved) return;
    suppressClick = true;
    setTimeout(() => (suppressClick = false));
    const from = media.getBoundingClientRect();
    delete media.dataset.dragging;
    media.style.translate = '';
    setSide(from.left + from.width / 2 < innerWidth / 2 ? 'left' : 'right', from);
  };
  media.addEventListener('pointerup', endDrag);
  media.addEventListener('pointercancel', endDrag);
  // Na slepen geen klik doorlaten naar de video (die zou pauzeren).
  media.addEventListener(
    'click',
    (e) => {
      if (!suppressClick) return;
      e.stopPropagation();
      e.preventDefault();
    },
    true,
  );
  moveBtn.addEventListener('click', () => setSide(state.side === 'right' ? 'left' : 'right'));

  /* ---------- Events ---------- */

  video.addEventListener('play', render);
  video.addEventListener('pause', () => {
    render();
    save();
  });
  video.addEventListener('ended', next);
  video.addEventListener('loadedmetadata', renderTime);
  video.addEventListener('durationchange', renderTime);
  video.addEventListener('volumechange', () => muteBtn.setAttribute('aria-pressed', String(video.muted)));
  video.addEventListener('timeupdate', () => {
    renderTime();
    const now = Date.now();
    if (now - lastSave > 5000) {
      lastSave = now;
      save();
    }
  });
  video.addEventListener('click', toggle);
  addEventListener('pagehide', save);

  seek.addEventListener('pointerdown', () => (seeking = true));
  seek.addEventListener('pointerup', () => (seeking = false));
  seek.addEventListener('input', async () => {
    const value = Number(seek.value);
    if (!attachedId && state.current) {
      state.position = value;
      renderTime();
      return;
    }
    video.currentTime = value;
    renderTime();
  });

  toggleBtn.addEventListener('click', toggle);
  $('[data-player-back]').addEventListener('click', () => (video.currentTime = Math.max(0, video.currentTime - 15)));
  $('[data-player-forward]').addEventListener('click', () => (video.currentTime = Math.min(duration(), video.currentTime + 30)));
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    save();
  });
  viewBtn.addEventListener('click', () => setView(state.view === 'audio' ? 'video' : 'audio'));
  $('[data-player-hide-video]').addEventListener('click', () => setView('audio'));
  $('[data-player-fullscreen]').addEventListener('click', () => {
    const el = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (media.requestFullscreen) media.requestFullscreen().catch(() => {});
    else el.webkitEnterFullscreen?.();
  });
  $('[data-player-share]').addEventListener('click', () => {
    if (!state.current) return;
    const url = new URL(state.current.href, location.origin);
    const time = Math.floor(attachedId ? video.currentTime : state.position);
    if (time > 0) url.searchParams.set('t', String(time));
    share({ url: url.href, title: state.current.title });
  });
  $('[data-player-close]').addEventListener('click', close);
  queueToggle.addEventListener('click', () => (queuePanel.hidden ? openQueue() : closeQueue()));
  $('[data-player-queue-clear]').addEventListener('click', () => {
    state.queue = [];
    render();
    save();
  });
  queuePanel.addEventListener('click', (e) => {
    const target = e.target as Element;
    const playId = target.closest<HTMLElement>('[data-queue-play]')?.dataset.queuePlay;
    const removeId = target.closest<HTMLElement>('[data-queue-remove]')?.dataset.queueRemove;
    if (playId) {
      const item = state.queue.find((q) => q.id === playId);
      if (item) play(item, 0);
    }
    if (removeId) {
      const item = state.queue.find((q) => q.id === removeId);
      if (item) toggleQueueItem(item);
      (queueList.querySelector('button') ?? queueHeading).focus();
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !queuePanel.hidden) closeQueue(true);
  });
  document.addEventListener('click', (e) => {
    if (!queuePanel.hidden && !(e.target as Element).closest('[data-player-queue-panel], [data-player-queue-toggle]')) closeQueue();
  });

  // Knoppen elders op de site
  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    const playBtn = target.closest<HTMLElement>('[data-player-play]');
    if (playBtn) {
      const item = parseItem(playBtn);
      if (!item) return;
      if (item.id === state.current?.id && attachedId === item.id) {
        toggle();
        return;
      }
      const urlTime = playBtn.hasAttribute('data-use-url-time') ? Number(new URLSearchParams(location.search).get('t')) : NaN;
      play(item, Number.isFinite(urlTime) && urlTime > 0 ? urlTime : item.id === state.current?.id ? state.position : 0);
      return;
    }
    const queueBtn = target.closest<HTMLElement>('[data-player-queue]');
    if (queueBtn) {
      const item = parseItem(queueBtn);
      if (item) toggleQueueItem(item);
    }
  });

  /* ---------- Paginawissels ---------- */

  // Tijdens de swap kan de browser een pause-event sturen terwijl het element even
  // verhuist. We onthouden of hij speelde en hervatten zo nodig.
  let wasPlaying = false;
  document.addEventListener('astro:before-swap', () => {
    wasPlaying = isPlaying();
  });
  // Synchroon tijdens de swap, zodat de view transition de nieuwe stand (docked/mini) al ziet.
  document.addEventListener('astro:after-swap', () => {
    closeQueue();
    connectStage();
    dock(false);
    if (wasPlaying && video.paused) video.play().catch(() => {});
    render();
  });
  document.addEventListener('astro:page-load', () => {
    connectStage();
    dock(false);
    render();
  });

  // Eerste load: herstel wat er stond (gepauzeerd, op de bewaarde positie).
  render();
  connectStage();
  dock(false);
  // hls.js alvast laden als er iets klaarstaat, zodat de eerste klik direct speelt.
  if (state.current && /\.m3u8/i.test(state.current.src) && !preferNativeHls()) {
    (window.requestIdleCallback ?? setTimeout)(() => import('hls.js'));
  }
}

customElements.define(
  'sd-player',
  class extends HTMLElement {
    connectedCallback() {
      init(this);
    }
  },
);
