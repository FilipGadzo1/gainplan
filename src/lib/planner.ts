import type { Macros, MealSlot, PlannedDay, PlannedMeal, Profile, Recipe, WeekPlan } from '../types';
import { RECIPES, getRecipe } from '../data/recipes';
import {
  EMPTY_MACROS,
  addMacros,
  mealSplit,
  recipeMacros,
  recipeTags,
  targetForDay,
} from './nutrition';

const SCALE_MIN = 0.5;
/** A 3x portion is a real bulking plate; beyond that the recipe is the wrong pick. */
const SCALE_MAX = 3;
const SCALE_STEP = 0.05;

/** Deterministic PRNG so a given seed always rebuilds the same week. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampScale(s: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(s / SCALE_STEP) * SCALE_STEP));
}

/** Recipes that survive the profile's restrictions and time budget. */
export function eligibleRecipes(profile: Profile): Recipe[] {
  const excluded = new Set(profile.exclude);
  const disliked = new Set(profile.dislikedRecipes);
  return RECIPES.filter((r) => {
    if (disliked.has(r.id)) return false;
    if (r.minutes > profile.maxMinutes) return false;
    for (const tag of recipeTags(r)) if (excluded.has(tag)) return false;
    return true;
  });
}

export function mealMacros(meal: PlannedMeal): Macros {
  return recipeMacros(getRecipe(meal.recipeId), meal.scale);
}

export function dayMacros(day: PlannedDay): Macros {
  return day.meals.reduce((acc, m) => addMacros(acc, mealMacros(m)), EMPTY_MACROS);
}

export function weekMacros(plan: WeekPlan): Macros {
  return plan.days.reduce((acc, d) => addMacros(acc, dayMacros(d)), EMPTY_MACROS);
}

/**
 * Squared relative distance from the day's targets.
 *
 * Scaling a portion moves every macro in the same proportion, so portion size
 * really only controls total energy — the macro *ratio* is decided by which
 * recipes got picked. So calories dominate here, and a protein shortfall is the
 * only other thing worth fighting for. Overshooting protein costs almost
 * nothing on purpose: these recipes are protein-dense by design, and an earlier
 * version of this weighting let the protein surplus veto hitting the calorie
 * target, leaving every day 5-15% under.
 */
function dayError(meals: PlannedMeal[], target: Macros, shares: number[]): number {
  const total = meals.reduce((acc, m) => addMacros(acc, mealMacros(m)), EMPTY_MACROS);
  const rel = (got: number, want: number) => (got - want) / Math.max(want, 1);

  const kcal = rel(total.kcal, target.kcal) ** 2;
  const pDiff = rel(total.protein, target.protein);
  const protein = pDiff < 0 ? pDiff ** 2 * 0.5 : 0;
  const fat = rel(total.fat, target.fat) ** 2 * 0.03;
  const carbs = rel(total.carbs, target.carbs) ** 2 * 0.03;

  // Keep each meal near its intended share of the day. Without this the
  // optimizer happily hits the daily total with a 1200 kcal breakfast and a
  // 300 kcal dinner, which is technically correct and useless in practice.
  const distribution = meals.reduce((sum, meal, i) => {
    const want = shares[i] ?? 1 / meals.length;
    const got = mealMacros(meal).kcal / Math.max(target.kcal, 1);
    return sum + (got - want) ** 2;
  }, 0);

  return kcal + protein + fat + carbs + distribution * 2;
}

/**
 * Coordinate descent over portion sizes. Locked meals keep the scale the user
 * chose and the rest of the day adjusts around them.
 */
function optimizePortions(meals: PlannedMeal[], target: Macros, shares: number[]): void {
  const movable = meals.map((m, i) => (m.locked ? -1 : i)).filter((i) => i >= 0);
  if (movable.length === 0) return;

  let best = dayError(meals, target, shares);
  for (const step of [0.2, 0.1, SCALE_STEP]) {
    let improved = true;
    let guard = 0;
    while (improved && guard++ < 60) {
      improved = false;
      for (const i of movable) {
        for (const delta of [step, -step]) {
          const original = meals[i].scale;
          const next = clampScale(original + delta);
          if (next === original) continue;
          meals[i].scale = next;
          const err = dayError(meals, target, shares);
          if (err < best - 1e-9) {
            best = err;
            improved = true;
          } else {
            meals[i].scale = original;
          }
        }
      }
    }
  }
}

interface PickContext {
  /** recipeId -> most recent day index it appeared on. */
  lastUsed: Map<string, number>;
  /** recipeId -> times used across the week so far. */
  useCount: Map<string, number>;
  usedToday: Set<string>;
}

/** Grams of protein per 100 kcal — the shape of a meal, independent of its size. */
function proteinDensity(m: Macros): number {
  return m.protein / Math.max(m.kcal / 100, 0.01);
}

function pickRecipe(
  candidates: Recipe[],
  slot: MealSlot,
  slotKcal: number,
  targetDensity: number,
  dayIndex: number,
  ctx: PickContext,
  rng: () => number,
): Recipe | null {
  const pool = candidates.filter((r) => r.slots.includes(slot) && !ctx.usedToday.has(r.id));
  if (pool.length === 0) return null;

  const scored = pool.map((r) => {
    const perServing = recipeMacros(r, 1);
    // How far the portion has to stretch from its natural size. Deliberately
    // uncapped so a recipe needing 3.5x scores worse than one needing 2x.
    const needed = slotKcal / Math.max(perServing.kcal, 1);
    const stretch = Math.abs(Math.log(needed));

    // Portion scaling cannot change a recipe's macro ratio, so this is the only
    // place the day's protein/carb balance gets decided. Falling short of the
    // target density costs more than exceeding it, but running far above it is
    // penalised too — otherwise the planner always picks the leanest, priciest
    // meat on the shelf and lands at 3+ g/kg of protein.
    const density = proteinDensity(perServing);
    const shortfall = Math.max(0, targetDensity - density) * 0.5;
    const excess = Math.max(0, density - targetDensity * 1.6) * 0.2;

    const last = ctx.lastUsed.get(r.id);
    const daysSince = last === undefined ? 99 : dayIndex - last;
    const repeat = daysSince <= 1 ? 6 : daysSince <= 2 ? 2.5 : daysSince <= 3 ? 1 : 0;
    const overuse = (ctx.useCount.get(r.id) ?? 0) * 1.2;

    const score = stretch * 3 + shortfall + excess + repeat + overuse + rng() * 1.4;
    return { r, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0].r;
}

export interface GenerateOptions {
  /** Meals marked locked in this plan are carried over untouched. */
  previous?: WeekPlan;
  seed?: number;
}

export function generatePlan(profile: Profile, opts: GenerateOptions = {}): WeekPlan {
  const rng = mulberry32(opts.seed ?? Date.now());
  const candidates = eligibleRecipes(profile);
  const split = mealSplit(profile.mealsPerDay);

  const ctx: PickContext = { lastUsed: new Map(), useCount: new Map(), usedToday: new Set() };
  const days: PlannedDay[] = [];
  let leftoverLunches = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const target = targetForDay(profile, dayIndex);
    const targetDensity = proteinDensity(target);
    const previousDay = days[dayIndex - 1];
    const prevLocked = opts.previous?.days[dayIndex]?.meals ?? [];
    ctx.usedToday = new Set();

    const meals: PlannedMeal[] = [];

    for (let slotIndex = 0; slotIndex < split.length; slotIndex++) {
      const { slot, share } = split[slotIndex];
      const slotKcal = target.kcal * share;

      // 1. A meal the user locked survives regeneration untouched.
      const locked = prevLocked[slotIndex];
      if (locked?.locked && locked.slot === slot) {
        meals.push({ ...locked });
        ctx.usedToday.add(locked.recipeId);
        ctx.lastUsed.set(locked.recipeId, dayIndex);
        ctx.useCount.set(locked.recipeId, (ctx.useCount.get(locked.recipeId) ?? 0) + 1);
        continue;
      }

      // 2. Eat yesterday's batch-cooked dinner for lunch, up to three times a week.
      if (
        profile.useLeftovers &&
        slot === 'lunch' &&
        previousDay &&
        leftoverLunches < 3 &&
        rng() < 0.7
      ) {
        const prevDinner = previousDay.meals.find((m) => m.slot === 'dinner' && !m.leftoverFromDay);
        if (prevDinner && getRecipe(prevDinner.recipeId).batchFriendly) {
          meals.push({
            slot,
            recipeId: prevDinner.recipeId,
            scale: clampScale(slotKcal / Math.max(recipeMacros(getRecipe(prevDinner.recipeId), 1).kcal, 1)),
            leftoverFromDay: dayIndex - 1,
          });
          ctx.usedToday.add(prevDinner.recipeId);
          leftoverLunches++;
          continue;
        }
      }

      // 3. Otherwise pick something new.
      const recipe = pickRecipe(candidates, slot, slotKcal, targetDensity, dayIndex, ctx, rng);
      if (!recipe) continue;

      meals.push({
        slot,
        recipeId: recipe.id,
        scale: clampScale(slotKcal / Math.max(recipeMacros(recipe, 1).kcal, 1)),
      });
      ctx.usedToday.add(recipe.id);
      ctx.lastUsed.set(recipe.id, dayIndex);
      ctx.useCount.set(recipe.id, (ctx.useCount.get(recipe.id) ?? 0) + 1);
    }

    optimizePortions(meals, target, split.map((s) => s.share));
    days.push({ index: dayIndex, training: profile.trainingDays.includes(dayIndex), target, meals });
  }

  return { createdAt: Date.now(), days };
}

/** Replaces one meal with a different recipe and rebalances that day. */
export function swapMeal(
  plan: WeekPlan,
  profile: Profile,
  dayIndex: number,
  mealIndex: number,
  seed = Date.now(),
): WeekPlan {
  const rng = mulberry32(seed);
  const day = plan.days[dayIndex];
  const meal = day.meals[mealIndex];
  const target = day.target;
  const split = mealSplit(profile.mealsPerDay);
  const share = split[mealIndex]?.share ?? 0.3;

  const ctx: PickContext = {
    lastUsed: new Map(),
    useCount: new Map(),
    // Avoid everything already on the plate today, plus what we are replacing.
    usedToday: new Set(day.meals.map((m) => m.recipeId)),
  };
  for (const d of plan.days) {
    for (const m of d.meals) {
      ctx.lastUsed.set(m.recipeId, Math.max(ctx.lastUsed.get(m.recipeId) ?? -99, d.index));
      ctx.useCount.set(m.recipeId, (ctx.useCount.get(m.recipeId) ?? 0) + 1);
    }
  }

  const replacement = pickRecipe(
    eligibleRecipes(profile),
    meal.slot,
    target.kcal * share,
    proteinDensity(target),
    dayIndex,
    ctx,
    rng,
  );
  if (!replacement) return plan;

  const meals = day.meals.map((m, i) =>
    i === mealIndex
      ? {
          slot: m.slot,
          recipeId: replacement.id,
          scale: clampScale(
            (target.kcal * share) / Math.max(recipeMacros(replacement, 1).kcal, 1),
          ),
          locked: m.locked,
        }
      : { ...m },
  );
  optimizePortions(meals, target, split.map((s) => s.share));

  const days = plan.days.map((d, i) => (i === dayIndex ? { ...d, meals } : d));
  return { ...plan, days };
}

/** Nudges one meal's portion by hand, then leaves the rest of the day alone. */
export function setMealScale(
  plan: WeekPlan,
  dayIndex: number,
  mealIndex: number,
  scale: number,
): WeekPlan {
  const days = plan.days.map((d, i) =>
    i === dayIndex
      ? { ...d, meals: d.meals.map((m, j) => (j === mealIndex ? { ...m, scale: clampScale(scale) } : m)) }
      : d,
  );
  return { ...plan, days };
}

export function toggleLock(plan: WeekPlan, dayIndex: number, mealIndex: number): WeekPlan {
  const days = plan.days.map((d, i) =>
    i === dayIndex
      ? { ...d, meals: d.meals.map((m, j) => (j === mealIndex ? { ...m, locked: !m.locked } : m)) }
      : d,
  );
  return { ...plan, days };
}

/** Rebalances a single day's portions back onto its targets. */
export function rebalanceDay(plan: WeekPlan, profile: Profile, dayIndex: number): WeekPlan {
  const day = plan.days[dayIndex];
  const meals = day.meals.map((m) => ({ ...m }));
  optimizePortions(meals, day.target, mealSplit(profile.mealsPerDay).map((s) => s.share));
  const days = plan.days.map((d, i) => (i === dayIndex ? { ...d, meals } : d));
  return { ...plan, days };
}

// Days are identified by a Monday-first index throughout the planner. Their
// names are display text, so they come from `useDayNames()` in src/i18n/hooks.ts.

/** Batch-cooking sessions: recipes cooked once and eaten across several days. */
export interface PrepTask {
  recipeId: string;
  dayIndex: number;
  servings: number;
  totalScale: number;
  eatenOn: number[];
  minutes: number;
}

export function prepPlan(plan: WeekPlan): PrepTask[] {
  const byRecipe = new Map<string, { dayIndex: number; scale: number }[]>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      const list = byRecipe.get(meal.recipeId) ?? [];
      list.push({ dayIndex: day.index, scale: meal.scale });
      byRecipe.set(meal.recipeId, list);
    }
  }

  const tasks: PrepTask[] = [];
  for (const [recipeId, uses] of byRecipe) {
    if (uses.length < 2) continue;
    const recipe = getRecipe(recipeId);
    if (!recipe.batchFriendly) continue;

    // Only group uses that fall inside a 4-day fridge window from the first one.
    const sorted = [...uses].sort((a, b) => a.dayIndex - b.dayIndex);
    let group: typeof sorted = [];
    const flush = () => {
      if (group.length >= 2) {
        const totalScale = group.reduce((s, u) => s + u.scale, 0);
        tasks.push({
          recipeId,
          dayIndex: group[0].dayIndex,
          servings: group.length,
          totalScale,
          eatenOn: group.map((u) => u.dayIndex),
          minutes: Math.round(recipe.minutes * (1 + 0.25 * (group.length - 1))),
        });
      }
      group = [];
    };
    for (const use of sorted) {
      if (group.length && use.dayIndex - group[0].dayIndex > 3) flush();
      group.push(use);
    }
    flush();
  }

  return tasks.sort((a, b) => a.dayIndex - b.dayIndex);
}
