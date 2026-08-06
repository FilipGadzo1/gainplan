import type { Dept, Ingredient, Recipe } from '../types';
import type { Language } from './index';

/**
 * Recipe and ingredient text lives in the data files rather than the locale
 * JSON, so a recipe's method sits next to the gram amounts it describes. These
 * accessors are the only place that knows which field holds which language —
 * components ask for "the name in the current language" and never touch
 * `.name` / `.en` / `.steps` directly.
 *
 * Every data file holds two languages: its region's own (`name`, `stepsLocal`,
 * `packName`) and English (`en`, `steps`, `packNameEn`). So the test is always
 * "English or not", never "Swedish or not" — Croatian data reads through these
 * same accessors without a schema change.
 */

export function recipeName(recipe: Recipe, lang: Language): string {
  return lang === 'en' ? recipe.en : recipe.name;
}

/** The name in the *other* language, shown as a subtitle beneath the title. */
export function recipeSubtitle(recipe: Recipe, lang: Language): string {
  return lang === 'en' ? recipe.name : recipe.en;
}

export function recipeSteps(recipe: Recipe, lang: Language): string[] {
  return lang === 'en' ? recipe.steps : recipe.stepsLocal;
}

export function ingredientName(ingredient: Ingredient, lang: Language): string {
  return lang === 'en' ? ingredient.en : ingredient.name;
}

/**
 * The other language's name. Kept visible in both directions on purpose: an
 * English reader still has to find "Kycklingfilé" on the shelf at ICA, and a
 * local-language reader benefits from the English name when checking a macro
 * table.
 */
export function ingredientSubtitle(ingredient: Ingredient, lang: Language): string {
  return lang === 'en' ? ingredient.name : ingredient.en;
}

export function packName(ingredient: Ingredient, lang: Language): string {
  return lang === 'en' ? ingredient.packNameEn : ingredient.packName;
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
