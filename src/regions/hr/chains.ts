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

export const KAUFLAND: Chain = {
  id: 'kaufland',
  name: 'Kaufland',
  area: 'Hrvatska',
  onlineUrl: 'https://www.kaufland.hr/',
  searchUrl: (term) => `https://www.kaufland.hr/pretrazivanje.html?q=${encodeURIComponent(term)}`,
};

/**
 * Konzum first: widest reach, and its catalogue is what the ingredient names
 * and `storeQuery` overrides in ./ingredients.ts were checked against.
 *
 * Plodine and Spar were here briefly and are gone. Neither exposes a URL that
 * carries a search term — both render client-side — so neither could link an
 * ingredient to the thing you actually put in the trolley, which is the only
 * reason to name a chain at all.
 */
export const HR_CHAINS: Chain[] = [KONZUM, KAUFLAND];
