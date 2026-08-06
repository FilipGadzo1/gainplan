/**
 * Plain, non-React equivalents of the few presentation helpers the dev scripts
 * need.
 *
 * The app gets these from hooks — `useDayNames`, `useQuantityFormat` — which a
 * Node script cannot call. Rather than hardcode a second copy of the day names,
 * these read the Swedish locale file, so renaming a day in one place still
 * moves the scripts with it. Scripts are Swedish-only on purpose: they are
 * eyeball checks for the developer, not product surface.
 */
import sv from '../src/i18n/locales/sv/common.json';

const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const DAY_NAMES: string[] = ORDER.map((k) => sv.days[k]);

/** Mirrors useQuantityFormat().grams: kilos past 1000 g, whole grams below. */
export const formatGrams = (g: number): string =>
  g >= 1000
    ? `${(g / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} ${sv.units.kilogram}`
    : `${Math.round(g)} ${sv.units.gram}`;
