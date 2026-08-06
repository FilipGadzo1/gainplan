import type { Chain } from '../index';

/**
 * The Croatian chains GainPlan supports, at chain level rather than per store:
 * prices are the nationally published figures, so naming a single branch would
 * imply a precision the data does not carry.
 *
 * Both search URLs were taken from the chains' own search forms and checked
 * against the live sites by counting the product links the response actually
 * contains — not by whether the page loads. Konzum's search page returns HTTP
 * 200 and renders its chrome for any query string you give it, so "the URL
 * works" is not evidence that the search does.
 *
 * Konzum's parameter is `search[term]`, from the name attribute on the input in
 * their #search_form. It is emphatically not `q`: that returns the search page
 * with an empty result list, which is a broken link wearing a 200.
 */

export const KONZUM: Chain = {
  id: 'konzum',
  name: 'Konzum',
  area: 'Hrvatska',
  onlineUrl: 'https://www.konzum.hr/',
  searchUrl: (term) =>
    `https://www.konzum.hr/web/search?search%5Bterm%5D=${encodeURIComponent(term)}`,
};

/**
 * No searchUrl. Kaufland's /pretrazivanje.html takes a `q`, but it is a
 * site-wide search: the response is identical whether you ask for the products
 * tab or the recipes tab, because the tabs are rendered client-side. Linking an
 * ingredient there lands you on a mixed list of recipes and news articles, so
 * the chain is listed for its prices and aisle order and its ingredients render
 * as plain text.
 */
export const KAUFLAND: Chain = {
  id: 'kaufland',
  name: 'Kaufland',
  area: 'Hrvatska',
  onlineUrl: 'https://www.kaufland.hr/',
};

/**
 * Konzum first: widest reach, the only Croatian chain that can deep-link a
 * product, and the catalogue the ingredient names and `storeQuery` overrides in
 * ./ingredients.ts were checked against.
 *
 * Plodine and Spar were here briefly and are gone. Both render client-side and
 * put nothing searchable in the address, and unlike Kaufland they were not
 * asked to stay.
 */
export const HR_CHAINS: Chain[] = [KONZUM, KAUFLAND];
