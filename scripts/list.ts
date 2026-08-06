/** Prints the copy/print shopping list text — checks the Swedish/English pairing. */
import { DEFAULT_PROFILE } from '../src/lib/storage';
import { generatePlan } from '../src/lib/planner';
import { buildShoppingList, shoppingListText } from '../src/lib/shopping';

console.log(shoppingListText(buildShoppingList(generatePlan(DEFAULT_PROFILE, { seed: 2026 }))));
