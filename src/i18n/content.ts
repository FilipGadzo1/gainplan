import type { DeptId, Ingredient, Recipe } from '../types';
import type { Region } from '../regions';
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

/** The name in the *other* language, or '' where both names are the same. */
export function recipeSubtitle(recipe: Recipe, lang: Language): string {
  if (recipe.name === recipe.en) return '';
  return lang === 'en' ? recipe.name : recipe.en;
}

export function recipeSteps(recipe: Recipe, lang: Language): string[] {
  return lang === 'en' ? recipe.steps : recipe.stepsLocal;
}

export function ingredientName(ingredient: Ingredient, lang: Language): string {
  return lang === 'en' ? ingredient.en : ingredient.name;
}

/**
 * The name in the *other* language, shown as a subtitle beneath the title, or
 * an empty string where there is no other language to show.
 *
 * Kept visible in both directions on purpose: an English reader still has to
 * find "Kycklingfilé" on the shelf at ICA, and a local-language reader benefits
 * from the English name when checking a macro table.
 *
 * A region whose own language is English carries the same string in both
 * fields. That is honest data rather than a mistake — there really is only one
 * name — so this returns nothing and every caller drops the line instead of
 * printing the title twice.
 */
export function ingredientSubtitle(ingredient: Ingredient, lang: Language): string {
  if (ingredient.name === ingredient.en) return '';
  return lang === 'en' ? ingredient.name : ingredient.en;
}

export function packName(ingredient: Ingredient, lang: Language): string {
  return lang === 'en' ? ingredient.packNameEn : ingredient.packName;
}

/**
 * English department names. Unlike the local ones these are not region
 * property: a Croatian shop's fish counter is still "Fish" in English, so one
 * map serves every region and only the local labels vary.
 */
const DEPT_EN: Record<DeptId, string> = {
  produce: 'Fruit & Veg',
  meat: 'Meat & Deli',
  fish: 'Fish',
  dairy: 'Dairy & Eggs',
  bread: 'Bread',
  pantry: 'Pantry',
  frozen: 'Frozen',
};

export function deptLabel(dept: DeptId, lang: Language, region: Region): string {
  return lang === 'en' ? DEPT_EN[dept] : region.deptLabels[dept];
}
