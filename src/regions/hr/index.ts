import type { Region } from '../index';
import { assertRegion } from '../index';
import { HR_CHAINS } from './chains';
import { HR_INGREDIENTS } from './ingredients';
import { HR_RECIPES } from './recipes';

export const CROATIA: Region = {
  id: 'hr',
  language: 'hr',
  currency: 'EUR',
  // Croatian shops run much the same way round as Swedish ones: produce inside
  // the door, the counters along the back wall, dry goods and freezers on the
  // way to the tills.
  deptOrder: ['produce', 'meat', 'fish', 'dairy', 'bread', 'frozen', 'pantry'],
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
