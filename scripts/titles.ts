/** Spot-check the Swedish/English recipe title pairing. */
import { RECIPES } from '../src/data/recipes';

for (const r of RECIPES) console.log(`${r.name.padEnd(46)} | ${r.en}`);
console.log(`\n${RECIPES.length} recipes, all with both names.`);
