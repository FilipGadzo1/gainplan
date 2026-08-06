import type { DeptId, Ingredient, ShoppingItem, ShoppingList, WeekPlan } from '../types';
import type { Chain, Region } from '../regions';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';

/**
 * Deep link into a chain's own search for one ingredient, or null where the
 * chain has no searchable URL to link to.
 */
export function chainSearchUrl(chain: Chain, ingredient: Ingredient): string | null {
  return chain.searchUrl?.(ingredient.storeQuery ?? ingredient.name) ?? null;
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
export function buildShoppingList(
  plan: WeekPlan,
  region: Region,
  factor = 1,
): ShoppingList {
  const totals = ingredientTotals(plan, factor);
  const byDept = new Map<DeptId, ShoppingItem[]>();
  let total = 0;

  for (const [id, grams] of totals) {
    if (grams <= 0) continue;
    const ingredient = getIngredient(id);
    const packs = ingredient.staple ? 1 : Math.max(1, Math.ceil(grams / ingredient.packSize));
    const boughtGrams = packs * ingredient.packSize;
    const cost = (boughtGrams / 1000) * ingredient.pricePerKg;

    total += cost;
    const list = byDept.get(ingredient.dept) ?? [];
    list.push({ ingredient, grams, packs, boughtGrams, cost });
    byDept.set(ingredient.dept, list);
  }

  const groups = region.deptOrder.filter((d) => byDept.has(d)).map((dept) => ({
    dept,
    items: byDept.get(dept)!.sort((a, b) => b.cost - a.cost),
  }));

  return {
    groups,
    total: Math.round(total),
    currency: region.currency,
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

/**
 * The bare host a recipe's source URL points at, for labelling the link.
 * Read off the URL rather than hardcoded, so a recipe sourced anywhere but
 * ica.se does not label itself as ICA. Returns '' for a missing or malformed
 * URL, which the callers only reach when a sourceUrl exists at all.
 */
export function sourceHost(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
