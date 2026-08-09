import { describe, expect, it } from 'vitest';
import type { DietTag, MealSlot, Recipe } from '../../types';
import { AE_INGREDIENTS } from './ingredients';
import { AE_RECIPES } from './recipes';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Tags resolved against this region's own catalogue rather than through
 * `recipeTags`, which goes via the shared `INGREDIENTS` lookup. That lookup
 * does not know about the UAE until the region is registered, which is a
 * later task and has to happen in the same commit as the merge — the id
 * uniqueness test in regions.test.ts ties the two together.
 *
 * Nothing is lost by checking it here instead: once the region is registered,
 * the parameterised restricted-eater suite in regions.test.ts runs this same
 * assertion against the real `recipeTags` for every region, this one included.
 */
const BY_ID = new Map(AE_INGREDIENTS.map((i) => [i.id, i]));

const tagsOf = (recipe: Recipe): Set<DietTag> => {
  const tags = new Set<DietTag>();
  for (const ri of recipe.ingredients) {
    const ing = BY_ID.get(ri.id);
    if (!ing) throw new Error(`${recipe.id} wants ${ri.id}, which this region does not stock`);
    for (const t of ing.tags) tags.add(t);
  }
  return tags;
};

describe('the UAE recipe pool', () => {
  it('is deep enough to plan a week without repeating itself', () => {
    expect(AE_RECIPES.length).toBeGreaterThanOrEqual(30);
  });

  it('prefixes every id', () => {
    for (const r of AE_RECIPES) expect(r.id.startsWith('ae-'), r.id).toBe(true);
  });

  it('gives no two recipes the same id', () => {
    const ids = AE_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only asks for ingredients this region stocks', () => {
    const stocked = new Set(AE_INGREDIENTS.map((i) => i.id));
    for (const r of AE_RECIPES) {
      for (const ri of r.ingredients) {
        expect(stocked.has(ri.id), `${r.id} wants ${ri.id}`).toBe(true);
      }
    }
  });

  it('titles each recipe once, because the region speaks English', () => {
    for (const r of AE_RECIPES) expect(r.name, r.id).toBe(r.en);
  });

  it('writes a method, and the same one in both fields', () => {
    // The type demands two languages and there is only one. Same text in both
    // is the honest answer; a mismatched length would be a copy-paste slip.
    for (const r of AE_RECIPES) {
      expect(r.steps.length, r.id).toBeGreaterThan(0);
      expect(r.stepsLocal, r.id).toEqual(r.steps);
    }
  });

  it('fills every meal slot', () => {
    for (const slot of SLOTS) {
      const n = AE_RECIPES.filter((r) => r.slots.includes(slot)).length;
      expect(n, `nothing to eat at ${slot}`).toBeGreaterThanOrEqual(4);
    }
  });

  it('feeds a restricted eater at every meal', () => {
    // The same contract regions.test.ts applies to every region, asserted here
    // so it fails in this file rather than three tasks later.
    const combos: [string, DietTag[]][] = [
      ['vegetarian', ['meat', 'pork', 'fish']],
      ['gluten free', ['gluten']],
      ['dairy free', ['dairy', 'lactose']],
      ['gluten + dairy free', ['gluten', 'dairy', 'lactose']],
    ];
    for (const [label, exclude] of combos) {
      const excluded = new Set(exclude);
      const usable = AE_RECIPES.filter((r) => ![...tagsOf(r)].some((t) => excluded.has(t)));
      for (const slot of SLOTS) {
        const n = usable.filter((r) => r.slots.includes(slot)).length;
        expect(n, `${label} / ${slot}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps a base serving to the size of a meal', () => {
    // Quantities are per one serving and the planner scales from there. A base
    // portion that is already a double sends the optimiser off in the wrong
    // direction.
    for (const r of AE_RECIPES) {
      const grams = r.ingredients.reduce((sum, ri) => sum + ri.g, 0);
      expect(grams, `${r.id} is tiny`).toBeGreaterThan(100);
      expect(grams, `${r.id} is enormous`).toBeLessThan(1200);
    }
  });

  it('does not scale the seasoning with the portion', () => {
    // Nobody wants 1.8x the garlic because they are bulking. Every recipe that
    // uses an aromatic should pin it.
    const aromatics = new Set(
      AE_INGREDIENTS.filter((i) => i.staple).map((i) => i.id),
    );
    for (const r of AE_RECIPES) {
      for (const ri of r.ingredients) {
        if (aromatics.has(ri.id)) expect(ri.fixed, `${r.id} / ${ri.id}`).toBe(true);
      }
    }
  });
});
