/**
 * Day names for the dev scripts.
 *
 * The app gets these from `useDayNames`, which a Node script cannot call.
 * Reading the Swedish locale rather than hardcoding a second copy means
 * renaming a day still moves the scripts with it.
 */
import sv from '../src/i18n/locales/sv/common.json';

const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const DAY_NAMES: string[] = ORDER.map((k) => sv.days[k]);
