import type { Region } from '../index';
import { assertRegion } from '../index';
import { HR_CHAINS } from './chains';
import { HR_INGREDIENTS } from './ingredients';
import { HR_RECIPES } from './recipes';

export const CROATIA: Region = {
  id: 'hr',
  language: 'en',
  currency: 'EUR',
  // Croatian shops run much the same way round as Swedish ones: produce inside
  // the door, the counters along the back wall, dry goods and freezers on the
  // way to the tills.
  deptOrder: ['produce', 'meat', 'fish', 'dairy', 'bread', 'frozen', 'pantry'],
  // Kept, and no longer rendered. `deptLabel` reaches for these only when the
  // interface is in a language other than English, and Croatia's no longer is.
  // They stay because `assertRegion` and the region tests require every
  // department to be named, and because the day this region gets a translation
  // worth shipping they are what it starts from. The shopping list currently
  // shows the English labels; the *product* names underneath are still
  // Croatian, which is the part you shop off.
  deptLabels: {
    produce: 'Voće i povrće',
    meat: 'Meso i mesne prerađevine',
    fish: 'Riba',
    dairy: 'Mliječni proizvodi i jaja',
    bread: 'Kruh i pekara',
    pantry: 'Trajni proizvodi',
    frozen: 'Smrznuto',
  },
  chains: HR_CHAINS,
  ingredients: HR_INGREDIENTS,
  recipes: HR_RECIPES,
};

assertRegion(CROATIA);
