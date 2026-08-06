/** Prints one generated week to the terminal — a quick eyeball check on realism. */
import { DEFAULT_PROFILE } from '../src/lib/storage';
import { generatePlan, dayMacros, DAY_NAMES, prepPlan } from '../src/lib/planner';
import { getRecipe } from '../src/data/recipes';
import { recipeMacros } from '../src/lib/nutrition';
import { buildShoppingList } from '../src/lib/shopping';

const profile = DEFAULT_PROFILE;
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
const list = buildShoppingList(plan);

console.log(
  `\nWeek avg: ${Math.round(week / 7)} kcal/day, ${Math.round(protein / 7)} g protein ` +
    `(${(protein / 7 / profile.weightKg).toFixed(1)} g/kg)`,
);
console.log(`Shopping: ${list.itemCount} items, ~${list.totalSek} kr (${Math.round(list.totalSek / 7)} kr/day)`);
console.log(`Batch sessions: ${prepPlan(plan).length}`);
