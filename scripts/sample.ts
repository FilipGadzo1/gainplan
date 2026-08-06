/**
 * Prints one generated week to the terminal — a quick eyeball check on realism.
 *
 *   npx vite-node scripts/sample.ts        Sweden
 *   npx vite-node scripts/sample.ts hr     Croatia
 *
 * Day names stay Swedish whichever region is printed. This is a developer's
 * eyeball check, not product surface, and translating it would only add a
 * second thing to keep in sync.
 */
import type { RegionId } from '../src/types';
import { REGION_IDS } from '../src/types';
import { DEFAULT_PROFILE } from '../src/lib/storage';
import { generatePlan, dayMacros, prepPlan } from '../src/lib/planner';
import { DAY_NAMES } from './_shared';
import { getRecipe } from '../src/data/recipes';
import { recipeMacros } from '../src/lib/nutrition';
import { buildShoppingList } from '../src/lib/shopping';
import { regionOf } from '../src/regions/registry';

const arg = process.argv[2];
if (arg && !(REGION_IDS as readonly string[]).includes(arg)) {
  console.error(`Unknown region "${arg}". Try one of: ${REGION_IDS.join(', ')}`);
  process.exit(1);
}

const region = regionOf((arg as RegionId) ?? 'se');
const profile = { ...DEFAULT_PROFILE, region: region.id };
const plan = generatePlan(profile, { seed: 2026 });

for (const day of plan.days) {
  const got = dayMacros(day);
  console.log(
    `\n${DAY_NAMES[day.index]}${day.training ? ' [training]' : ''}  ` +
      `${Math.round(got.kcal)}/${day.target.kcal} kcal  ` +
      `P${Math.round(got.protein)}/${day.target.protein} C${Math.round(got.carbs)} F${Math.round(got.fat)}`,
  );
  for (const meal of day.meals) {
    const r = getRecipe(meal.recipeId);
    const m = recipeMacros(r, meal.scale);
    console.log(
      `   ${meal.slot.padEnd(10)} ${String(Math.round(meal.scale * 100)).padStart(3)}%  ` +
        `${String(Math.round(m.kcal)).padStart(4)} kcal  ${String(Math.round(m.protein)).padStart(3)}p  ` +
        `${r.name}${meal.leftoverFromDay !== undefined ? '  <- leftover' : ''}`,
    );
  }
}

const week = plan.days.reduce((s, d) => s + dayMacros(d).kcal, 0);
const protein = plan.days.reduce((s, d) => s + dayMacros(d).protein, 0);
const list = buildShoppingList(plan, region);

console.log(
  `\nWeek avg: ${Math.round(week / 7)} kcal/day, ${Math.round(protein / 7)} g protein ` +
    `(${(protein / 7 / profile.weightKg).toFixed(1)} g/kg)`,
);
const money = (n: number) => `${Math.round(n)} ${list.currency === 'SEK' ? 'kr' : 'EUR'}`;
console.log(`Shopping: ${list.itemCount} items, ~${money(list.total)} (${money(list.total / 7)}/day)`);
console.log(`Batch sessions: ${prepPlan(plan).length}`);
