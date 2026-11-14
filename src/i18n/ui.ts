/*
 * Interfaceteksten. Engels is de standaard; Nederlands staat klaar voor de NL-routes (volgende stap).
 * Gebruik: t('nav.sets'). Ontbreekt een NL-tekst, dan valt hij terug op Engels.
 */
const en = {
  'skip': 'Skip to content',
  'nav.label': 'Main',
  'nav.sets': 'Sets',
  'nav.djs': 'DJs',
  'nav.genres': 'Genres',
  'nav.about': 'About',
  'theme.label': 'Theme',
  'theme.system': 'Auto',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'home.browseSets': 'Browse all sets',
  'set.play': 'Play',
  'set.pause': 'Pause',
  'set.queue': 'Add to queue',
  'set.queued': 'In queue',
  'set.share': 'Share',
  'set.copied': 'Link copied',
  'set.about': 'About this set',
  'set.tracklist': 'Tracklist',
  'set.more': 'You might also like',
  'set.moreFrom': 'More from',
  'sets.latest': 'Latest sets',
  'sets.all': 'All sets',
  'sets.count': 'sets',
  'sets.filter': 'Filter by genre',
  'sets.allGenres': 'All',
  'djs.title': 'DJs',
  'djs.resident': 'Resident',
  'djs.sets': 'Sets',
  'djs.plays': 'Plays',
  'genres.title': 'Genres',
  'genres.djs': 'DJs who play it',
  'footer.follow': 'Follow',
  'carousel.prev': 'Previous sets',
  'carousel.next': 'Next sets',
  'footer.explore': 'Explore',
  'footer.allGenres': 'All genres',
  'player.label': 'Player',
  'player.nowPlaying': 'Now playing',
  'player.back': 'Back 15 seconds',
  'player.forward': 'Forward 30 seconds',
  'player.seek': 'Position',
  'player.mute': 'Mute',
  'player.audioOnly': 'Audio only',
  'player.queue': 'Queue',
  'player.queueEmpty': 'Your queue is empty. Add sets with the + button.',
  'player.clear': 'Clear queue',
  'player.close': 'Close player',
  'player.shareMoment': 'Share this moment',
  'player.openSet': 'Open set page',
  'player.hideVideo': 'Hide video',
  'player.showVideo': 'Show video',
  'player.moveLeft': 'Move video to the left',
  'player.moveRight': 'Move video to the right',
  'player.playNow': 'Play now',
  'player.remove': 'Remove',
  'notFound.title': 'Lost in space',
  'notFound.text': 'This page drifted off. Try the sets instead.',
  'status.comingSoon': 'Coming soon',
  'status.maintenance': 'Back soon',
  'status.maintenanceText': 'We are tuning the dome. Check back in a little while.',
  'status.launch': 'Launching',
  'status.backAt': 'Expected back',
  'status.now': 'Any moment now',
  'countdown.days': 'Days',
  'countdown.hours': 'Hours',
  'countdown.minutes': 'Min',
  'countdown.seconds': 'Sec',
} as const;

type Key = keyof typeof en;

const nl: Partial<Record<Key, string>> = {
  'skip': 'Naar de inhoud',
  'nav.sets': 'Sets',
  'nav.about': 'Over',
  'set.queue': 'Aan wachtrij toevoegen',
  'set.queued': 'In wachtrij',
  'set.share': 'Delen',
  'player.queue': 'Wachtrij',
};

export const languages = { en, nl } as const;
export type Lang = keyof typeof languages;

export function useTranslations(lang: Lang = 'en') {
  return (key: Key) => (languages[lang] as Partial<Record<Key, string>>)[key] ?? en[key];
}

export const t = useTranslations('en');
