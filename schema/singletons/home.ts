import { HomeIcon } from '@sanity/icons/Home';
import { defineField, defineType } from 'sanity';
import { vereistInBasistaal } from '../i18n';

/** Homepage (singleton, ID `home`): de teksten in de hero. De uitgelichte set kies je op de set zelf. */
export const home = defineType({
  name: 'home',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'internationalizedArrayString',
      description: 'Grote kop bovenaan, in hoofdletters. Kort houden: het langste woord bepaalt hoe groot de kop op een telefoon wordt.',
      validation: vereistInBasistaal,
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'internationalizedArrayText',
      description: 'Eén of twee zinnen onder de kop. Los van de omschrijving voor zoekmachines (Site-instellingen → SEO).',
      validation: vereistInBasistaal,
    }),
  ],
  preview: { prepare: () => ({ title: 'Home' }) },
});
