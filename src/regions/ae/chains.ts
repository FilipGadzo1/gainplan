import type { Chain } from '../index';

/**
 * The Dubai chains GainPlan supports, at chain level rather than per store:
 * prices are hand-estimated national figures, so naming a single branch would
 * imply a precision the data does not carry.
 *
 * Both search URLs were checked against the live sites by looking at what the
 * response contains, not at whether it returns 200 — the lesson from Konzum,
 * which rendered its whole search page for a parameter it did not understand
 * and looked like a working link for weeks.
 */

/**
 * Union Coop runs Magento Luma and renders search server-side, which makes it
 * the one chain here whose results can actually be counted.
 *
 * `?q=chicken` comes back carrying category refinement links — `&cat=2764`,
 * `&cat=2780`, a dozen more — and a link to page two. The control, `?q=zzqqxx`,
 * comes back with neither. That difference is the evidence; the 200 is not.
 */
export const UNION_COOP: Chain = {
  id: 'unioncoop',
  name: 'Union Coop',
  area: 'Dubai',
  onlineUrl: 'https://www.unioncoop.ae/',
  searchUrl: (term) =>
    `https://www.unioncoop.ae/catalogsearch/result/?q=${encodeURIComponent(term)}`,
};

/**
 * Lulu renders results client-side, so the product links cannot be counted from
 * the HTML, and every guessable search path — /search, /en-ae/search/,
 * /catalogsearch/result — returns 404 against a category path that returns 200.
 *
 * The working URL is the one Lulu publishes in its own schema.org SearchAction:
 * /en-ae/list/?search_text=. The server honours the term even though the markup
 * does not show it — "chicken" streams 610 KB, "salmon" 636 KB, and the
 * nonsense control "zzqqxxvv" only 470 KB, with the salmon payload carrying
 * real rows like "Fresh Norwegian Salmon Steak".
 */
export const LULU: Chain = {
  id: 'lulu',
  name: 'Lulu Hypermarket',
  area: 'Dubai',
  onlineUrl: 'https://gcc.luluhypermarket.com/en-ae',
  searchUrl: (term) =>
    `https://gcc.luluhypermarket.com/en-ae/list/?search_text=${encodeURIComponent(term)}`,
};

/**
 * Union Coop first: its search is server-rendered, which makes it the chain the
 * ingredient names and `storeQuery` overrides in ./ingredients.ts were checked
 * against, exactly as Konzum was for Croatia.
 */
export const AE_CHAINS: Chain[] = [UNION_COOP, LULU];
