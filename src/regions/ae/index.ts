import type { Region } from '../index';
import { assertRegion } from '../index';
import { AE_CHAINS } from './chains';
import { AE_INGREDIENTS } from './ingredients';
import { AE_RECIPES } from './recipes';

export const UAE: Region = {
  id: 'ae',
  // The first region whose own language is English. `languagesFor` collapses to
  // a single option here, and the content accessors return no subtitle, because
  // there is no second name to show.
  language: 'en',
  currency: 'AED',
  // A Gulf hypermarket puts the bakery inside the door, next to the fruit, and
  // runs the fresh counters along the back wall. Freezers come before the dry
  // aisles on the way to the tills.
  deptOrder: ['produce', 'bread', 'meat', 'fish', 'dairy', 'frozen', 'pantry'],
  // Required by assertRegion and never rendered: `deptLabel` reaches for these
  // only when the interface is in a language other than English, and this
  // region has no other language. They hold the English labels so that if that
  // ever changes, nothing reads as missing.
  deptLabels: {
    produce: 'Fruit & Veg',
    meat: 'Meat & Deli',
    fish: 'Fish',
    dairy: 'Dairy & Eggs',
    bread: 'Bread',
    pantry: 'Pantry',
    frozen: 'Frozen',
  },
  chains: AE_CHAINS,
  ingredients: AE_INGREDIENTS,
  recipes: AE_RECIPES,
};

assertRegion(UAE);
