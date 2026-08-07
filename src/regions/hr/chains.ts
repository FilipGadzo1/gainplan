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
 * Kaufland's `q` is a site-wide search, and it leads with products: "losos"
 * puts the fresh fillet and the packaged slices above the recipes and the
 * food-lexicon entries.
 *
 * What it cannot do is guarantee them. Kaufland Hrvatska has no webshop, so the
 * products it can show are the ones in the current week's promotional
 * catalogue; ask for something not on offer this week and the product block is
 * simply absent and you land on articles about the ingredient instead. That is
 * a link that gets less useful, not one that goes nowhere, which is why it
 * earns a place here where Studenac's newsletter form did not.
 */
export const KAUFLAND: Chain = {
  id: 'kaufland',
  name: 'Kaufland',
  area: 'Hrvatska',
  onlineUrl: 'https://www.kaufland.hr/',
  searchUrl: (term) =>
    `https://www.kaufland.hr/pretrazivanje.html?q=${encodeURIComponent(term)}`,
};

/**
 * Konzum first: widest reach, the deepest product search of the two, and the
 * catalogue the ingredient names and `storeQuery` overrides in ./ingredients.ts
 * were checked against.
 *
 * Plodine, Spar and Studenac were all here briefly and are gone. The first two
 * render client-side and put nothing searchable in the address; Studenac has no
 * webshop at all, only a newsletter form and a parcel service.
 */
export const HR_CHAINS: Chain[] = [KONZUM, KAUFLAND];
