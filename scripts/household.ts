/** How household size actually affects the basket. */
import { DEFAULT_PROFILE } from '../src/lib/storage';
import { generatePlan } from '../src/lib/planner';
import { buildShoppingList, ingredientTotals } from '../src/lib/shopping';
import { SWEDEN } from '../src/regions/se';

const plan = generatePlan(DEFAULT_PROFILE, { seed: 2026 });

for (const f of [1, 1.4, 1.65, 2, 2.05, 3]) {
  const list = buildShoppingList(plan, SWEDEN, f);
  const needed = [...ingredientTotals(plan, f).values()].reduce((a, b) => a + b, 0);
  const bought = list.groups.flatMap((g) => g.items).reduce((s, i) => s + i.boughtGrams, 0);
  console.log(
    `factor ${f.toFixed(2)}  ${String(list.total).padStart(5)} kr  ` +
      `(${(list.total / buildShoppingList(plan, SWEDEN, 1).total).toFixed(2)}× cost)  ` +
      `waste ${Math.round((1 - needed / bought) * 100)}%`,
  );
}
