import type { Dept, Ingredient, ShoppingItem, ShoppingList, WeekPlan } from '../types';
import { DEPT_ORDER } from '../types';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';

/** ICA Kvantum Uppsala (Gränby Centrum, Marknadsgatan 1) in ICA's own store ids. */
export const ICA_STORE = {
  id: '1003871',
  name: 'ICA Kvantum Uppsala',
  area: 'Gränby Centrum, Marknadsgatan 1',
  onlineUrl: 'https://handlaprivatkund.ica.se/stores/1003871',
  infoUrl: 'https://www.ica.se/butiker/kvantum/uppsala/ica-kvantum-uppsala-1003871/',
} as const;

/**
 * Deep link into the store's own search for one ingredient. ICA has no public
 * "add to basket" URL, so landing on the search results is as far as we can
 * take you — from there it is one tap to the cart.
 */
export function icaSearchUrl(ingredient: Ingredient): string {
  const term = ingredient.storeQuery ?? ingredient.name;
  return `${ICA_STORE.onlineUrl}/search?q=${encodeURIComponent(term)}`;
}

/**
 * Total grams of every ingredient the week calls for.
 *
 * `factor` is the household multiplier: 1 when you cook for yourself, 1.65 when
 * you also cook for a partner who eats 65% of your portion. Seasonings scale
 * with it too — cooking for two really does need more cumin.
 */
export function ingredientTotals(plan: WeekPlan, factor = 1): Map<string, number> {
  const totals = new Map<string, number>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      const recipe = getRecipe(meal.recipeId);
      for (const ri of recipe.ingredients) {
        const grams = (ri.fixed ? ri.g : ri.g * meal.scale) * factor;
        totals.set(ri.id, (totals.get(ri.id) ?? 0) + grams);
      }
    }
  }
  return totals;
}

/**
 * Rounds the week's requirements up to whole packs and groups them the way you
 * walk the store. Staples are capped at one pack — you are not buying 2 kg of
 * cumin because seven recipes each want a teaspoon.
 */
export function buildShoppingList(plan: WeekPlan, factor = 1): ShoppingList {
  const totals = ingredientTotals(plan, factor);
  const byDept = new Map<Dept, ShoppingItem[]>();
  let totalSek = 0;

  for (const [id, grams] of totals) {
    if (grams <= 0) continue;
    const ingredient = getIngredient(id);
    const packs = ingredient.staple ? 1 : Math.max(1, Math.ceil(grams / ingredient.packSize));
    const boughtGrams = packs * ingredient.packSize;
    const costSek = (boughtGrams / 1000) * ingredient.pricePerKg;

    totalSek += costSek;
    const list = byDept.get(ingredient.dept) ?? [];
    list.push({ ingredient, grams, packs, boughtGrams, costSek });
    byDept.set(ingredient.dept, list);
  }

  const groups = DEPT_ORDER.filter((d) => byDept.has(d)).map((dept) => ({
    dept,
    items: byDept.get(dept)!.sort((a, b) => b.costSek - a.costSek),
  }));

  return {
    groups,
    totalSek: Math.round(totalSek),
    itemCount: totals.size,
  };
}

/** How many whole units a counted ingredient (eggs, bananas) works out to. */
export function unitCount(item: ShoppingItem): number | null {
  const { ingredient, grams } = item;
  return ingredient.unitWeight ? Math.ceil(grams / ingredient.unitWeight) : null;
}

// Quantity strings and the plain-text export are language-dependent and live in
// src/i18n/useShoppingFormat.ts. Everything above this line is arithmetic.
