import { describe, expect, it } from 'vitest';
import { DEPT_IDS, REGION_IDS } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { assertRegion, type Region } from './index';
import { DEFAULT_REGION, REGIONS, regionOf } from './registry';

const regions = Object.values(REGIONS);

/**
 * These are the invariants a hand-written region has to hold. Every one of them
 * is invisible to the type checker — `DeptId[]` accepts an empty array, and
 * `Ingredient[]` accepts two rows with the same id — and each fails somewhere
 * far from its cause: a missing department silently drops items from the
 * shopping list, a duplicate id silently resolves to whichever row was written
 * last.
 */
describe('every region', () => {
  it.each(regions.map((r) => [r.id, r] as const))('%s passes assertRegion', (_id, region) => {
    expect(() => assertRegion(region)).not.toThrow();
  });

  it.each(regions.map((r) => [r.id, r] as const))(
    '%s names every department it walks',
    (_id, region: Region) => {
      for (const dept of DEPT_IDS) {
        expect(region.deptLabels[dept]?.trim(), dept).toBeTruthy();
      }
    },
  );

  it.each(regions.map((r) => [r.id, r] as const))(
    '%s stocks every ingredient its recipes call for',
    (_id, region: Region) => {
      const stocked = new Set(region.ingredients.map((i) => i.id));
      for (const recipe of region.recipes) {
        for (const ri of recipe.ingredients) {
          expect(stocked.has(ri.id), `${recipe.id} wants ${ri.id}`).toBe(true);
        }
      }
    },
  );

  it.each(regions.map((r) => [r.id, r] as const))(
    '%s files every ingredient under a real department',
    (_id, region: Region) => {
      for (const ing of region.ingredients) {
        expect(DEPT_IDS, ing.id).toContain(ing.dept);
      }
    },
  );

  it.each(regions.map((r) => [r.id, r] as const))(
    '%s writes every recipe method in both languages, step for step',
    (_id, region: Region) => {
      for (const recipe of region.recipes) {
        expect(recipe.stepsLocal.length, recipe.id).toBe(recipe.steps.length);
        expect(recipe.steps.length, recipe.id).toBeGreaterThan(0);
      }
    },
  );
});

/**
 * The registries in data/ are shared across regions rather than split per
 * region, which is only safe while ids are globally unique. This is the test
 * that keeps it safe — if a Croatian ingredient ever reuses a Swedish id, a
 * Swedish shopping list would quietly price the Croatian product.
 */
describe('ids are unique across regions, not just within one', () => {
  it('gives no two ingredients the same id', () => {
    const seen = new Map<string, string>();
    for (const region of regions) {
      for (const ing of region.ingredients) {
        const owner = seen.get(ing.id);
        expect(owner, `${ing.id} is in both ${owner} and ${region.id}`).toBeUndefined();
        seen.set(ing.id, region.id);
      }
    }
    // The shared lookup must see exactly what the regions hold, or an id
    // resolves to a product no region actually sells.
    expect(seen.size).toBe(Object.keys(INGREDIENTS).length);
  });

  it('gives no two recipes the same id', () => {
    const seen = new Map<string, string>();
    for (const region of regions) {
      for (const recipe of region.recipes) {
        const owner = seen.get(recipe.id);
        expect(owner, `${recipe.id} is in both ${owner} and ${region.id}`).toBeUndefined();
        seen.set(recipe.id, region.id);
      }
    }
  });
});

describe('the registry', () => {
  it('has an entry for every declared region id', () => {
    for (const id of REGION_IDS) expect(REGIONS[id]?.id, id).toBe(id);
  });

  it('falls back rather than throwing on an id it does not know', () => {
    expect(regionOf('atlantis' as never).id).toBe(DEFAULT_REGION);
  });

  it('gives every region at least one chain, with a working search URL', () => {
    for (const region of regions) {
      expect(region.chains.length, region.id).toBeGreaterThan(0);
      for (const chain of region.chains) {
        const url = new URL(chain.searchUrl('nötfärs 5%'));
        expect(url.protocol, chain.id).toBe('https:');
        // The term has to survive escaping — a raw % or space would otherwise
        // produce a malformed URL rather than a failed search.
        expect(url.href, chain.id).toContain(encodeURIComponent('nötfärs 5%'));
      }
    }
  });
});
