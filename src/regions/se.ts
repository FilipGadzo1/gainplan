import type { Region } from './index';
import { assertRegion } from './index';
import { INGREDIENT_LIST } from '../data/ingredients';
import { RECIPES } from '../data/recipes';

/**
 * ICA Kvantum Uppsala (Gränby Centrum, Marknadsgatan 1). One store, in ICA's
 * own store ids — the whole Swedish region is built around this shop's shelves
 * and aisle order.
 */
const ICA_KVANTUM_UPPSALA = {
  // The chain, not the store: the id identifies who you are shopping with, and
  // is what the logo and any stored preference key off. The store number lives
  // in the URLs below, which is the only place it means anything.
  id: 'ica',
  name: 'ICA Kvantum Uppsala',
  area: 'Gränby Centrum, Marknadsgatan 1',
  onlineUrl: 'https://handlaprivatkund.ica.se/stores/1003871',
  infoUrl: 'https://www.ica.se/butiker/kvantum/uppsala/ica-kvantum-uppsala-1003871/',
  searchUrl: (term: string) =>
    `https://handlaprivatkund.ica.se/stores/1003871/search?q=${encodeURIComponent(term)}`,
};

export const SWEDEN: Region = {
  id: 'se',
  language: 'sv',
  currency: 'SEK',
  // Frozen before pantry: the freezers sit on the way back to the tills, and
  // you want them in the trolley last.
  deptOrder: ['produce', 'meat', 'fish', 'dairy', 'bread', 'frozen', 'pantry'],
  deptLabels: {
    produce: 'Frukt & Grönt',
    meat: 'Kött & Chark',
    fish: 'Fisk',
    dairy: 'Mejeri & Ägg',
    bread: 'Bröd',
    pantry: 'Skafferi',
    frozen: 'Fryst',
  },
  chains: [ICA_KVANTUM_UPPSALA],
  ingredients: INGREDIENT_LIST,
  recipes: RECIPES,
};

assertRegion(SWEDEN);
