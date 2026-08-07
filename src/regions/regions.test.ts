import { describe, expect, it } from 'vitest';
import type { DietTag, MealSlot } from '../types';
import { DEPT_IDS, REGION_IDS } from '../types';
import { recipeTags } from '../lib/nutrition';
import { INGREDIENTS } from '../data/ingredients';
import { assertRegion, type Region } from './index';
import { DEFAULT_REGION, REGIONS, regionOf } from './registry';

const regions = Object.values(REGIONS);
const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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

/**
 * A pool can satisfy every structural rule above and still leave a restricted
 * eater with nothing to eat at some hour of the day. That failure does not
 * throw — the planner just repeats whatever it can find, or cannot fill the
 * slot — so it has to be asserted rather than waited for.
 *
 * The Croatian pool was written with this in mind and covers gluten-free plus
 * dairy-free at every slot. The Swedish one predates the check and scrapes
 * through breakfast and snack with a single recipe each, which is why the floor
 * here is one rather than something more comfortable.
 */
describe('every region can still feed a restricted eater', () => {
  const COMBOS: [string, DietTag[]][] = [
    ['vegetarian', ['meat', 'pork', 'fish']],
    ['gluten free', ['gluten']],
    ['dairy free', ['dairy', 'lactose']],
    ['gluten + dairy free', ['gluten', 'dairy', 'lactose']],
  ];

  for (const region of regions) {
    for (const [label, exclude] of COMBOS) {
      it(`${region.id} has a ${label} option at every meal`, () => {
        const excluded = new Set(exclude);
        const usable = region.recipes.filter(
          (r) => ![...recipeTags(r)].some((tag) => excluded.has(tag)),
        );
        for (const slot of MEAL_SLOTS) {
          const n = usable.filter((r) => r.slots.includes(slot)).length;
          expect(n, `${region.id} / ${label} / ${slot}`).toBeGreaterThan(0);
        }
      });
    }
  }
});

/**
 * Search URLs are the one thing here that depends on a third party's routing,
 * and they fail silently: Konzum answers 200 and renders its whole page for any
 * query string, so a wrong parameter name looks exactly like a working link
 * until you notice every result list is empty. That is what shipped, using ?q=
 * where their form posts search[term].
 *
 * These assert the parameter names taken from each chain's own search form.
 * They cannot prove the search works — only the live site does that, and the
 * names in ingredients.ts were checked against it by counting returned products
 * — but they do stop the shape being changed by accident.
 */
describe('chain search URLs keep the parameter each site expects', () => {
  const chainNamed = (id: string) =>
    regions.flatMap((r) => r.chains).find((c) => c.id === id);

  it('sends Konzum search[term], not q', () => {
    const url = new URL(chainNamed('konzum')!.searchUrl!('mlijeko'));
    expect(url.pathname).toBe('/web/search');
    expect(url.searchParams.get('search[term]')).toBe('mlijeko');
    expect(url.searchParams.get('q')).toBeNull();
  });

  it('sends Kaufland q', () => {
    // Site-wide search, and it leads with products where the week's catalogue
    // has one. See ./hr/chains.ts for why an occasional miss still earns a link.
    const url = new URL(chainNamed('kaufland')!.searchUrl!('losos'));
    expect(url.pathname).toBe('/pretrazivanje.html');
    expect(url.searchParams.get('q')).toBe('losos');
  });

  it('leaves every region at least one chain that can look an ingredient up', () => {
    for (const region of regions) {
      expect(
        region.chains.some((c) => c.searchUrl),
        `${region.id} has no searchable chain`,
      ).toBe(true);
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

  it('gives every region at least one chain, each reachable over https', () => {
    for (const region of regions) {
      expect(region.chains.length, region.id).toBeGreaterThan(0);
      for (const chain of region.chains) {
        expect(new URL(chain.onlineUrl).protocol, chain.id).toBe('https:');
      }
    }
  });

  it('escapes the search term wherever a chain has a search URL', () => {
    // Not every chain has one: Spar and Plodine render client-side and put
    // nothing searchable in the address. Those are skipped rather than faked.
    const searchable = regions.flatMap((r) => r.chains).filter((c) => c.searchUrl);
    expect(searchable.length).toBeGreaterThan(0);

    for (const chain of searchable) {
      const url = new URL(chain.searchUrl!('nötfärs 5%'));
      expect(url.protocol, chain.id).toBe('https:');
      // A raw % or space would produce a malformed URL, not a failed search.
      expect(url.href, chain.id).toContain(encodeURIComponent('nötfärs 5%'));
    }
  });
});
