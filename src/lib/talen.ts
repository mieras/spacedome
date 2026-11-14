/*
 * Talen van de site. Gedeeld door de Sanity Studio en de site, daarom zonder imports.
 * Engels is de basistaal: verplicht in Sanity en de terugval in queries.
 */
export const talen = [
  { id: 'en', title: 'English' },
  { id: 'nl', title: 'Nederlands' },
];

export const standaardTaal = 'en';

export type Taal = 'en' | 'nl';
