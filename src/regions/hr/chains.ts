import type { Chain } from '../index';

/**
 * The four chains GainPlan supports in Croatia, at chain level rather than per
 * store: prices are the nationally published figures, so naming a single branch
 * would imply a precision the data does not carry.
 *
 * Only two of the four expose a URL that carries a search term. Both were
 * checked against the live sites rather than guessed:
 *
 * - Konzum  /web/search?q=…        returns real products
 * - Kaufland /pretrazivanje.html?q=… taken from the input name on their own form
 *
 * Spar and Plodine render their sites client-side and put nothing searchable in
 * the address bar, so they get no searchUrl and their ingredients render as
 * plain text. A link that lands on a page which has never heard of the
 * ingredient is worse than no link.
 */

export const KONZUM: Chain = {
  id: 'konzum',
  name: 'Konzum',
  area: 'Hrvatska',
  onlineUrl: 'https://www.konzum.hr/',
  searchUrl: (term) => `https://www.konzum.hr/web/search?q=${encodeURIComponent(term)}`,
};

export const KAUFLAND: Chain = {
  id: 'kaufland',
  name: 'Kaufland',
  area: 'Hrvatska',
  onlineUrl: 'https://www.kaufland.hr/',
  searchUrl: (term) => `https://www.kaufland.hr/pretrazivanje.html?q=${encodeURIComponent(term)}`,
};

export const PLODINE: Chain = {
  id: 'plodine',
  name: 'Plodine',
  area: 'Hrvatska',
  onlineUrl: 'https://www.plodine.hr/',
};

export const SPAR: Chain = {
  id: 'spar',
  name: 'Spar',
  area: 'Hrvatska',
  onlineUrl: 'https://www.spar.hr/',
};

/** Konzum first: widest reach, and the only one with a verified product search. */
export const HR_CHAINS: Chain[] = [KONZUM, KAUFLAND, PLODINE, SPAR];
