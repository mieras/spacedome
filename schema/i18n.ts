import type { Rule } from 'sanity';
import { standaardTaal } from '../src/lib/talen';

type I18nItem = { _key: string; language?: string; value?: unknown };

const leeg = (v: unknown) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);

/** Validatie voor een internationalizedArray-veld: de basistaal (Engels) moet ingevuld zijn. */
export const vereistInBasistaal = (rule: Rule) =>
  rule.custom<I18nItem[]>((items) => {
    const basis = items?.find((i) => i.language === standaardTaal);
    return basis && !leeg(basis.value) ? true : `Vul in elk geval de ${standaardTaal.toUpperCase()}-versie in.`;
  });
