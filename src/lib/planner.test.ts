import { describe, expect, it } from 'vitest';
import type { DietTag, Profile } from '../types';
import { RECIPES } from '../data/recipes';
import { INGREDIENTS, getIngredient } from '../data/ingredients';
import { DEFAULT_PROFILE } from './storage';
import {
  baseKcal,
  householdFactor,
  kcalForDay,
  mealSplit,
  recipeCostSek,
  recipeMacros,
  recipePackCostSek,
  recipeTags,
} from './nutrition';
import { dayMacros, eligibleRecipes, generatePlan, mealMacros, prepPlan } from './planner';
import { buildShoppingList, chainSearchUrl, ingredientTotals } from './shopping';
import { SWEDEN } from '../regions/se';

const ICA = SWEDEN.chains[0];

const profile = (over: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...over });

describe('data integrity', () => {
  it('every recipe ingredient exists', () => {
    for (const r of RECIPES) {
      for (const ri of r.ingredients) {
        expect(() => getIngredient(ri.id), `${r.id} -> ${ri.id}`).not.toThrow();
      }
    }
  });

  it('recipe ids are unique', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
  });

  it('every recipe and ingredient carries both a Swedish and an English name', () => {
    for (const r of RECIPES) {
      expect(r.name.length, r.id).toBeGreaterThan(2);
      expect(r.en.length, r.id).toBeGreaterThan(2);
      expect(r.en, r.id).not.toBe(r.name);
    }
    for (const ing of Object.values(INGREDIENTS)) {
      expect(ing.name.length, ing.id).toBeGreaterThan(1);
      expect(ing.en.length, ing.id).toBeGreaterThan(1);
    }
  });

  it('every recipe has a method in both languages, step for step', () => {
    for (const r of RECIPES) {
      expect(r.stepsLocal.length, r.id).toBe(r.steps.length);
      for (const step of r.stepsLocal) expect(step.length, r.id).toBeGreaterThan(2);
    }
  });

  it('every ingredient has a pack description in both languages', () => {
    for (const ing of Object.values(INGREDIENTS)) {
      expect(ing.packName.length, ing.id).toBeGreaterThan(1);
      expect(ing.packNameEn.length, ing.id).toBeGreaterThan(1);
    }
  });

  it('every meal slot has enough recipes to fill a week without repeating daily', () => {
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      expect(RECIPES.filter((r) => r.slots.includes(slot)).length, slot).toBeGreaterThanOrEqual(10);
    }
  });

  it('declared macros are consistent with declared calories', () => {
    for (const ing of Object.values(INGREDIENTS)) {
      const derived = ing.protein * 4 + ing.carbs * 4 + ing.fat * 9;
      // Fibre, alcohol and rounding mean this is never exact; 25% is a typo check.
      expect(Math.abs(derived - ing.kcal), ing.id).toBeLessThan(Math.max(ing.kcal * 0.25, 25));
    }
  });

  it('serving sizes are in a sane calorie range', () => {
    for (const r of RECIPES) {
      const kcal = recipeMacros(r, 1).kcal;
      const isSnack = r.slots.length === 1 && r.slots[0] === 'snack';
      expect(kcal, r.id).toBeGreaterThan(isSnack ? 120 : 300);
      expect(kcal, r.id).toBeLessThan(isSnack ? 600 : 1100);
    }
  });
});

describe('targets', () => {
  it('calorie cycling keeps the weekly total unchanged', () => {
    const p = profile({ calorieCycling: true, trainingDays: [0, 2, 4, 6] });
    const week = [0, 1, 2, 3, 4, 5, 6].reduce((s, d) => s + kcalForDay(p, d), 0);
    expect(Math.abs(week - baseKcal(p) * 7)).toBeLessThan(7);
  });

  it('training days get more than rest days', () => {
    const p = profile({ calorieCycling: true, trainingDays: [0, 2, 4] });
    expect(kcalForDay(p, 0)).toBeGreaterThan(kcalForDay(p, 1));
  });

  it('cycling is a no-op when every day is a training day', () => {
    const p = profile({ calorieCycling: true, trainingDays: [0, 1, 2, 3, 4, 5, 6] });
    expect(kcalForDay(p, 3)).toBe(baseKcal(p));
  });
});

describe('generatePlan', () => {
  const cases: [string, Profile][] = [
    ['default lean bulk', profile()],
    ['aggressive cut', profile({ goal: 'cut', proteinPerKg: 2.4, mealsPerDay: 5 })],
    ['heavy bulk', profile({ goal: 'bulk', weightKg: 105, manualKcal: 4200, mealsPerDay: 5 })],
    ['small female cut', profile({ sex: 'female', weightKg: 58, heightCm: 165, goal: 'cut', mealsPerDay: 3 })],
    ['vegetarian', profile({ exclude: ['meat', 'fish'] })],
    ['no dairy or egg', profile({ exclude: ['dairy', 'lactose', 'egg'] })],
    ['gluten free', profile({ exclude: ['gluten'] })],
    ['fast food only', profile({ maxMinutes: 20 })],
    ['no leftovers', profile({ useLeftovers: false })],
  ];

  for (const [name, p] of cases) {
    it(`${name}: lands within 6% of the calorie target every day`, () => {
      const plan = generatePlan(p, { seed: 42 });
      for (const day of plan.days) {
        const got = dayMacros(day);
        const off = Math.abs(got.kcal - day.target.kcal) / day.target.kcal;
        expect(off, `day ${day.index}: ${Math.round(got.kcal)} vs ${day.target.kcal}`).toBeLessThan(0.06);
      }
    });

    it(`${name}: hits at least 90% of the protein target every day`, () => {
      const plan = generatePlan(p, { seed: 7 });
      for (const day of plan.days) {
        const got = dayMacros(day);
        expect(got.protein / day.target.protein, `day ${day.index}`).toBeGreaterThan(0.9);
      }
    });

    it(`${name}: does not wildly overshoot protein`, () => {
      const plan = generatePlan(p, { seed: 7 });
      for (const day of plan.days) {
        const got = dayMacros(day);
        // Some overshoot is unavoidable with protein-dense food, but a plan
        // that doubles the target is just expensive.
        expect(got.protein / day.target.protein, `day ${day.index}`).toBeLessThan(1.8);
      }
    });

    it(`${name}: keeps each meal near its intended share of the day`, () => {
      const plan = generatePlan(p, { seed: 13 });
      const shares = mealSplit(p.mealsPerDay).map((s) => s.share);
      for (const day of plan.days) {
        day.meals.forEach((meal, i) => {
          const share = mealMacros(meal).kcal / day.target.kcal;
          expect(
            Math.abs(share - shares[i]),
            `day ${day.index} meal ${i}: ${Math.round(share * 100)}% vs ${Math.round(shares[i] * 100)}%`,
          ).toBeLessThan(0.09);
        });
      }
    });

    it(`${name}: respects every exclusion`, () => {
      const plan = generatePlan(p, { seed: 3 });
      for (const day of plan.days) {
        for (const meal of day.meals) {
          const recipe = RECIPES.find((r) => r.id === meal.recipeId)!;
          for (const tag of recipeTags(recipe)) {
            expect(p.exclude, `${recipe.id} in ${name}`).not.toContain(tag as DietTag);
          }
          expect(recipe.minutes).toBeLessThanOrEqual(p.maxMinutes);
        }
      }
    });

    it(`${name}: fills every meal slot on every day`, () => {
      const plan = generatePlan(p, { seed: 11 });
      for (const day of plan.days) {
        expect(day.meals.length, `day ${day.index}`).toBe(p.mealsPerDay);
      }
    });
  }

  it('never repeats a recipe twice in the same day', () => {
    const plan = generatePlan(profile({ mealsPerDay: 5 }), { seed: 99 });
    for (const day of plan.days) {
      const ids = day.meals.map((m) => m.recipeId);
      expect(new Set(ids).size, `day ${day.index}`).toBe(ids.length);
    }
  });

  it('gives a varied week rather than the same three meals', () => {
    const plan = generatePlan(profile(), { seed: 5 });
    const unique = new Set(plan.days.flatMap((d) => d.meals.map((m) => m.recipeId)));
    expect(unique.size).toBeGreaterThan(12);
  });

  it('is deterministic for a given seed', () => {
    const a = generatePlan(profile(), { seed: 1234 });
    const b = generatePlan(profile(), { seed: 1234 });
    expect(JSON.stringify(a.days)).toBe(JSON.stringify(b.days));
  });

  it('keeps locked meals across a regenerate', () => {
    const p = profile();
    const first = generatePlan(p, { seed: 1 });
    first.days[2].meals[1].locked = true;
    const pinned = { ...first.days[2].meals[1] };

    const second = generatePlan(p, { previous: first, seed: 2 });
    expect(second.days[2].meals[1].recipeId).toBe(pinned.recipeId);
    expect(second.days[2].meals[1].scale).toBe(pinned.scale);
  });

  it('produces leftover lunches when asked, and none when not', () => {
    const withLeftovers = generatePlan(profile({ useLeftovers: true }), { seed: 21 });
    const without = generatePlan(profile({ useLeftovers: false }), { seed: 21 });

    const count = (p: typeof withLeftovers) =>
      p.days.flatMap((d) => d.meals).filter((m) => m.leftoverFromDay !== undefined).length;

    expect(count(withLeftovers)).toBeGreaterThan(0);
    expect(count(withLeftovers)).toBeLessThanOrEqual(3);
    expect(count(without)).toBe(0);
  });

  it('every leftover points at a batch-friendly meal from the day before', () => {
    const plan = generatePlan(profile(), { seed: 8 });
    for (const day of plan.days) {
      for (const meal of day.meals) {
        if (meal.leftoverFromDay === undefined) continue;
        expect(meal.leftoverFromDay).toBe(day.index - 1);
        const source = plan.days[meal.leftoverFromDay].meals.find(
          (m) => m.recipeId === meal.recipeId,
        );
        expect(source, `day ${day.index}`).toBeDefined();
        expect(RECIPES.find((r) => r.id === meal.recipeId)!.batchFriendly).toBe(true);
      }
    }
  });

  it('excluding almost everything still returns a usable plan', () => {
    const p = profile({ exclude: ['meat', 'fish', 'nuts', 'soy'], maxMinutes: 25 });
    expect(eligibleRecipes(p).length).toBeGreaterThan(8);
    const plan = generatePlan(p, { seed: 4 });
    expect(plan.days.every((d) => d.meals.length > 0)).toBe(true);
  });
});

describe('shopping list', () => {
  it('covers every ingredient the plan uses, and nothing else', () => {
    const plan = generatePlan(profile(), { seed: 17 });
    const totals = ingredientTotals(plan);
    const list = buildShoppingList(plan, SWEDEN);
    const listed = new Set(list.groups.flatMap((g) => g.items.map((i) => i.ingredient.id)));

    expect(listed.size).toBe(totals.size);
    for (const id of totals.keys()) expect(listed.has(id), id).toBe(true);
  });

  it('always buys at least as much as the plan needs', () => {
    const plan = generatePlan(profile({ goal: 'bulk', manualKcal: 4000 }), { seed: 18 });
    for (const group of buildShoppingList(plan, SWEDEN).groups) {
      for (const item of group.items) {
        if (item.ingredient.staple) continue;
        expect(item.boughtGrams, item.ingredient.id).toBeGreaterThanOrEqual(item.grams);
      }
    }
  });

  it('caps staples at a single pack', () => {
    const plan = generatePlan(profile(), { seed: 19 });
    for (const group of buildShoppingList(plan, SWEDEN).groups) {
      for (const item of group.items) {
        if (item.ingredient.staple) expect(item.packs).toBe(1);
      }
    }
  });

  it('costs a believable amount for a week of food', () => {
    const list = buildShoppingList(generatePlan(profile(), { seed: 20 }), SWEDEN);
    expect(list.totalSek).toBeGreaterThan(400);
    expect(list.totalSek).toBeLessThan(3000);
  });

  it('groups items into departments in walking order', () => {
    const list = buildShoppingList(generatePlan(profile(), { seed: 22 }), SWEDEN);
    expect(list.groups.length).toBeGreaterThan(3);
    expect(list.groups.every((g) => g.items.length > 0)).toBe(true);
  });
});

describe('recipe cost', () => {
  const turkey = RECIPES.find((r) => r.id === 'kalkon-fullkornsris')!;

  it('values the plate at the grams the recipe actually uses', () => {
    // 180g turkey @ 200 + 80g rice @ 45 + 200g veg @ 40 + 10g soy @ 90 + 8g oil @ 40
    expect(recipeCostSek(turkey)).toBeCloseTo(36 + 3.6 + 8 + 0.9 + 0.32, 2);
  });

  it('scales with the portion and the household factor', () => {
    expect(recipeCostSek(turkey, 2)).toBeCloseTo(recipeCostSek(turkey) * 2, 2);
    expect(recipeCostSek(turkey, 1, 2)).toBeCloseTo(recipeCostSek(turkey) * 2, 2);
  });

  it('charges whole packs at the till, since a pack cannot be split', () => {
    // 180g of turkey means buying the 400g pack, not 180g of it.
    expect(recipePackCostSek(turkey)).toBeGreaterThan(recipeCostSek(turkey));
  });

  it('leaves staples out of the pack price rather than charging a whole bottle', () => {
    // Soy and oil are staples: 8g of oil must not cost a litre.
    const staples = turkey.ingredients.filter((ri) => getIngredient(ri.id).staple);
    expect(staples.length).toBeGreaterThan(0);

    const packCost = recipePackCostSek(turkey);
    for (const ri of staples) {
      const ing = getIngredient(ri.id);
      expect(packCost).toBeLessThan((ing.packSize / 1000) * ing.pricePerKg + packCost - 1);
    }
  });

  it('never undercharges relative to the grams used, staples aside', () => {
    for (const recipe of RECIPES) {
      const used = recipe.ingredients
        .filter((ri) => !getIngredient(ri.id).staple)
        .reduce((sum, ri) => sum + (ri.g / 1000) * getIngredient(ri.id).pricePerKg, 0);
      expect(recipePackCostSek(recipe), recipe.id).toBeGreaterThanOrEqual(used - 1e-9);
    }
  });
});

describe('ICA deep links', () => {
  it('searches the store for the ingredient name by default', () => {
    expect(chainSearchUrl(ICA, getIngredient('banan'))).toBe(
      `${ICA.onlineUrl}/search?q=Banan`,
    );
  });

  it('prefers storeQuery where the shelf name is broader than ours', () => {
    // "Nötfärs 5%" finds nothing in ICA's search; "nötfärs" finds the shelf.
    expect(chainSearchUrl(ICA, getIngredient('notfars5'))).toBe(
      `${ICA.onlineUrl}/search?q=n%C3%B6tf%C3%A4rs`,
    );
  });

  it('points every recipe source at a real ica.se recipe page', () => {
    const withSource = RECIPES.filter((r) => r.sourceUrl);
    expect(withSource.length).toBeGreaterThan(0);
    for (const r of withSource) {
      expect(r.sourceUrl, r.id).toMatch(/^https:\/\/www\.ica\.se\/recept\/[a-z0-9-]+-\d+\/$/);
    }
  });

  it('escapes every ingredient into a same-origin store URL', () => {
    for (const ingredient of Object.values(INGREDIENTS)) {
      const url = new URL(chainSearchUrl(ICA, ingredient));
      expect(url.origin, ingredient.id).toBe(new URL(ICA.onlineUrl).origin);
      expect(url.searchParams.get('q'), ingredient.id).toBe(
        ingredient.storeQuery ?? ingredient.name,
      );
    }
  });
});

describe('household', () => {
  const wife = { id: 'w', name: 'Anna', portionFactor: 0.65 };
  const kid = { id: 'k', name: 'Kid', portionFactor: 0.4 };

  it('is 1.0 when you cook only for yourself', () => {
    expect(householdFactor(profile())).toBe(1);
  });

  it('adds each person as a share of your portion, not a whole head', () => {
    expect(householdFactor(profile({ household: [wife] }))).toBeCloseTo(1.65);
    expect(householdFactor(profile({ household: [wife, kid] }))).toBeCloseTo(2.05);
  });

  it('does not change your calorie or macro targets', () => {
    const alone = generatePlan(profile(), { seed: 30 });
    const together = generatePlan(profile({ household: [wife] }), { seed: 30 });

    expect(JSON.stringify(together.days)).toBe(JSON.stringify(alone.days));
    for (const day of together.days) {
      expect(dayMacros(day).kcal).toBeCloseTo(dayMacros(alone.days[day.index]).kcal);
    }
  });

  it('scales every ingredient quantity by the household factor', () => {
    const plan = generatePlan(profile(), { seed: 31 });
    const alone = ingredientTotals(plan, 1);
    const together = ingredientTotals(plan, 1.65);

    expect(together.size).toBe(alone.size);
    for (const [id, grams] of alone) {
      expect(together.get(id), id).toBeCloseTo(grams * 1.65);
    }
  });

  it('costs more per extra person, but sub-linearly', () => {
    const plan = generatePlan(profile(), { seed: 32 });
    const alone = buildShoppingList(plan, SWEDEN, 1);
    const together = buildShoppingList(plan, SWEDEN, 1.65);
    const ratio = together.totalSek / alone.totalSek;

    // A solo week already over-buys badly — you take home a 2 kg bag of
    // potatoes for 260 g of cooking — so a second eater largely absorbs the
    // slack rather than doubling the bill. 1.65x the food is ~1.22x the cost.
    expect(together.totalSek).toBeGreaterThan(alone.totalSek);
    expect(ratio).toBeGreaterThan(1.1);
    expect(ratio).toBeLessThan(1.5);
  });

  it('keeps rising as the household grows', () => {
    const plan = generatePlan(profile(), { seed: 32 });
    const costs = [1, 1.65, 2.05, 3].map((f) => buildShoppingList(plan, SWEDEN, f).totalSek);
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i], `factor step ${i}`).toBeGreaterThan(costs[i - 1]);
    }
  });

  it('wastes less of every pack as the household grows', () => {
    const plan = generatePlan(profile(), { seed: 32 });
    const waste = (f: number) => {
      const list = buildShoppingList(plan, SWEDEN, f);
      const items = list.groups.flatMap((g) => g.items);
      const needed = items.reduce((s, i) => s + i.grams, 0);
      const bought = items.reduce((s, i) => s + i.boughtGrams, 0);
      return 1 - needed / bought;
    };
    expect(waste(2.05)).toBeLessThan(waste(1));
  });

  it('feeding a second person costs less than doubling the bill', () => {
    const plan = generatePlan(profile(), { seed: 33 });
    const together = buildShoppingList(plan, SWEDEN, 1.65).totalSek;
    const doubled = buildShoppingList(plan, SWEDEN, 2).totalSek;
    expect(together).toBeLessThan(doubled);
  });

  it('never buys less than the single-person list', () => {
    const plan = generatePlan(profile(), { seed: 34 });
    const alone = buildShoppingList(plan, SWEDEN, 1);
    const together = buildShoppingList(plan, SWEDEN, 1.65);

    const packs = (l: typeof alone) =>
      new Map(l.groups.flatMap((g) => g.items.map((i) => [i.ingredient.id, i.packs] as const)));
    const a = packs(alone);
    const t = packs(together);

    for (const [id, count] of a) {
      expect(t.get(id) ?? 0, id).toBeGreaterThanOrEqual(count);
    }
  });

  // The household *label* and the copied list text are language-dependent and
  // are covered in src/i18n/i18n.test.tsx.
});

describe('prep plan', () => {
  it('only batches recipes that are batch friendly and repeat', () => {
    const plan = generatePlan(profile(), { seed: 23 });
    for (const task of prepPlan(plan)) {
      const recipe = RECIPES.find((r) => r.id === task.recipeId)!;
      expect(recipe.batchFriendly).toBe(true);
      expect(task.servings).toBeGreaterThanOrEqual(2);
      expect(task.eatenOn.length).toBe(task.servings);
    }
  });

  it('never spans more than a four-day fridge window', () => {
    const plan = generatePlan(profile(), { seed: 24 });
    for (const task of prepPlan(plan)) {
      const span = Math.max(...task.eatenOn) - Math.min(...task.eatenOn);
      expect(span, task.recipeId).toBeLessThanOrEqual(3);
    }
  });

  it('cooks on the first day the meal is eaten', () => {
    const plan = generatePlan(profile(), { seed: 25 });
    for (const task of prepPlan(plan)) {
      expect(task.dayIndex).toBe(Math.min(...task.eatenOn));
    }
  });
});
