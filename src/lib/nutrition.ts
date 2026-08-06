import type { ActivityLevel, DietTag, Goal, Ingredient, Macros, MealSlot, Profile, Recipe } from '../types';
import { getIngredient } from '../data/ingredients';

/**
 * Only the arithmetic lives here. The labels and hints these ids are shown
 * under are in the `setup` locale namespace, keyed by the same ids.
 */
export const ACTIVITY: Record<ActivityLevel, { factor: number }> = {
  sedentary: { factor: 1.2 },
  light: { factor: 1.375 },
  moderate: { factor: 1.55 },
  high: { factor: 1.725 },
  athlete: { factor: 1.9 },
};

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY) as ActivityLevel[];

export const GOALS: Record<Goal, { pct: number; protein: number }> = {
  cut: { pct: -0.2, protein: 2.2 },
  maintain: { pct: 0, protein: 1.8 },
  'lean-bulk': { pct: 0.1, protein: 2.0 },
  bulk: { pct: 0.2, protein: 1.8 },
};

export const GOAL_IDS = Object.keys(GOALS) as Goal[];

/** Mifflin-St Jeor — the standard for lean, trained populations. */
export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY[p.activity].factor;
}

/** The daily calorie target before training/rest-day cycling. */
export function baseKcal(p: Profile): number {
  if (p.manualKcal && p.manualKcal > 0) return p.manualKcal;
  return Math.round(tdee(p) * (1 + GOALS[p.goal].pct));
}

/**
 * Calories for one day of the week. With cycling on, training days get +10%
 * and rest days give the same total back, so the weekly intake is unchanged.
 */
export function kcalForDay(p: Profile, dayIndex: number): number {
  const base = baseKcal(p);
  if (!p.calorieCycling) return base;

  const training = p.trainingDays.length;
  const rest = 7 - training;
  if (training === 0 || rest === 0) return base;

  const bump = base * 0.1;
  return Math.round(
    p.trainingDays.includes(dayIndex) ? base + bump : base - (bump * training) / rest,
  );
}

/** Splits a calorie target into protein/carbs/fat grams. */
export function macrosForKcal(p: Profile, kcal: number): Macros {
  const protein = Math.round(p.proteinPerKg * p.weightKg);
  const fat = Math.round((kcal * p.fatPct) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}

export function targetForDay(p: Profile, dayIndex: number): Macros {
  return macrosForKcal(p, kcalForDay(p, dayIndex));
}

/** How the day's calories are split across meals, in order. */
export function mealSplit(mealsPerDay: Profile['mealsPerDay']): { slot: MealSlot; share: number }[] {
  if (mealsPerDay === 3) {
    return [
      { slot: 'breakfast', share: 0.28 },
      { slot: 'lunch', share: 0.36 },
      { slot: 'dinner', share: 0.36 },
    ];
  }
  if (mealsPerDay === 4) {
    return [
      { slot: 'breakfast', share: 0.25 },
      { slot: 'lunch', share: 0.3 },
      { slot: 'snack', share: 0.13 },
      { slot: 'dinner', share: 0.32 },
    ];
  }
  return [
    { slot: 'breakfast', share: 0.22 },
    { slot: 'snack', share: 0.11 },
    { slot: 'lunch', share: 0.27 },
    { slot: 'snack', share: 0.11 },
    { slot: 'dinner', share: 0.29 },
  ];
}

/**
 * How much food to cook, as a multiple of your own portion. You count as 1.0,
 * everyone else adds their own share. Used for shopping quantities and batch
 * cooking only — never for your macro targets.
 */
export function householdFactor(p: Profile): number {
  return 1 + p.household.reduce((sum, m) => sum + m.portionFactor, 0);
}

// The matching display label ("Du + Anna") is built by `useHouseholdLabel` in
// src/i18n/hooks.ts — this module stays free of user-facing text.

export const EMPTY_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function scaleMacros(m: Macros, f: number): Macros {
  return { kcal: m.kcal * f, protein: m.protein * f, carbs: m.carbs * f, fat: m.fat * f };
}

export function macrosForGrams(ing: Ingredient, grams: number): Macros {
  const f = grams / 100;
  return { kcal: ing.kcal * f, protein: ing.protein * f, carbs: ing.carbs * f, fat: ing.fat * f };
}

/** Macros for one serving of a recipe at the given portion scale. */
export function recipeMacros(recipe: Recipe, scale = 1): Macros {
  return recipe.ingredients.reduce((acc, ri) => {
    const grams = ri.fixed ? ri.g : ri.g * scale;
    return addMacros(acc, macrosForGrams(getIngredient(ri.id), grams));
  }, EMPTY_MACROS);
}

/** Every diet tag present anywhere in a recipe. */
export function recipeTags(recipe: Recipe): Set<DietTag> {
  const tags = new Set<DietTag>();
  for (const ri of recipe.ingredients) {
    for (const t of getIngredient(ri.id).tags) tags.add(t);
  }
  return tags;
}

/**
 * What the food on the plate is worth: only the grams the recipe actually uses.
 *
 * This is not what the shop charges you — see `recipePackCostSek`. Keeping the
 * two apart matters, because 180 g of turkey is 36 kr of turkey but you cannot
 * buy 180 g of it.
 */
export function recipeCostSek(recipe: Recipe, scale = 1, factor = 1): number {
  return recipe.ingredients.reduce((sum, ri) => {
    const grams = (ri.fixed ? ri.g : ri.g * scale) * factor;
    const ing = getIngredient(ri.id);
    return sum + (grams / 1000) * ing.pricePerKg;
  }, 0);
}

/**
 * What this meal costs at the till if you shopped for it alone: every
 * non-staple ingredient rounded up to whole packs, the way `buildShoppingList`
 * charges it.
 *
 * Staples are excluded rather than rounded. A meal wanting 8 g of rapeseed oil
 * does not cost you a litre bottle — you already own it, and the shopping list
 * caps staples at one pack for the whole week for the same reason. Including
 * them here would make every meal look like it costs a pantry.
 *
 * Over a full week this overstates less than it looks: the leftover 220 g of a
 * turkey pack gets eaten by another meal, which is exactly why the shopping
 * list totals packs across the week instead of per meal.
 */
export function recipePackCostSek(recipe: Recipe, scale = 1, factor = 1): number {
  return recipe.ingredients.reduce((sum, ri) => {
    const ing = getIngredient(ri.id);
    if (ing.staple) return sum;
    const grams = (ri.fixed ? ri.g : ri.g * scale) * factor;
    const packs = Math.max(1, Math.ceil(grams / ing.packSize));
    return sum + ((packs * ing.packSize) / 1000) * ing.pricePerKg;
  }, 0);
}
