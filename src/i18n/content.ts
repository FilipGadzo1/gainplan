import type { Dept, Ingredient, Recipe } from '../types';
import type { Language } from './index';

/**
 * Recipe and ingredient text lives in the data files rather than the locale
 * JSON, so a recipe's method sits next to the gram amounts it describes. These
 * accessors are the only place that knows which field holds which language —
 * components ask for "the name in the current language" and never touch
 * `.name` / `.en` / `.steps` directly.
 */

export function recipeName(recipe: Recipe, lang: Language): string {
  return lang === 'sv' ? recipe.name : recipe.en;
}

/** The name in the *other* language, shown as a subtitle beneath the title. */
export function recipeSubtitle(recipe: Recipe, lang: Language): string {
  return lang === 'sv' ? recipe.en : recipe.name;
}

export function recipeSteps(recipe: Recipe, lang: Language): string[] {
  return lang === 'sv' ? recipe.stepsSv : recipe.steps;
}

export function ingredientName(ingredient: Ingredient, lang: Language): string {
  return lang === 'sv' ? ingredient.name : ingredient.en;
}

/**
 * The other language's name. Kept visible in both directions on purpose: an
 * English reader still has to find "Kycklingfilé" on the shelf at ICA, and a
 * Swedish reader benefits from the English name when checking a macro table.
 */
export function ingredientSubtitle(ingredient: Ingredient, lang: Language): string {
  return lang === 'sv' ? ingredient.en : ingredient.name;
}

export function packName(ingredient: Ingredient, lang: Language): string {
  return lang === 'sv' ? ingredient.packName : ingredient.packNameEn;
}

/**
 * Department names double as the `Dept` union's values, so the Swedish form is
 * the identity and only English needs a lookup.
 */
const DEPT_EN: Record<Dept, string> = {
  'Frukt & Grönt': 'Fruit & Veg',
  'Kött & Chark': 'Meat & Deli',
  Fisk: 'Fish',
  'Mejeri & Ägg': 'Dairy & Eggs',
  Bröd: 'Bread',
  Skafferi: 'Pantry',
  Fryst: 'Frozen',
};

export function deptLabel(dept: Dept, lang: Language): string {
  return lang === 'sv' ? dept : DEPT_EN[dept];
}
