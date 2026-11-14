import { CogIcon } from '@sanity/icons/Cog';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { PlayIcon } from '@sanity/icons/Play';
import { TagIcon } from '@sanity/icons/Tag';
import { UserIcon } from '@sanity/icons/User';
import type { StructureResolver } from 'sanity/structure';

/** Studio: Sets, DJ's, Genres, Pagina's, dan Site-instellingen (_standards/SANITY.md §0). */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Space Dome')
    .items([
      S.documentTypeListItem('set').title('Sets').icon(PlayIcon),
      S.documentTypeListItem('dj').title("DJ's").icon(UserIcon),
      S.documentTypeListItem('genre').title('Genres').icon(TagIcon),
      S.documentTypeListItem('page').title("Pagina's").icon(DocumentsIcon),
      S.divider(),
      S.listItem()
        .title('Site-instellingen')
        .id('siteSettings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site-instellingen')),
    ]);
