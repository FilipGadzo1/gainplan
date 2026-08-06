import type { Currency, DeptId, Ingredient, Recipe, RegionId } from '../types';
import { DEPT_IDS } from '../types';
import type { Language } from '../i18n';

/**
 * A region is everywhere the app has to know *where you shop* rather than *what
 * you eat*. Departments, their walking order, the chains, the currency and the
 * catalogue all differ between countries; macro maths and portion optimisation
 * do not, and stay out of here.
 *
 * The rule that makes this tractable: a region owns exactly one non-English
 * language, and every data file it holds is written in that language plus
 * English. So the accessors in i18n/content.ts only ever ask "English or not",
 * and never have to know which region produced the row they were handed.
 */

/**
 * One supermarket chain. Sweden has a single entry because the app is built
 * around one specific ICA store; Croatia will have several, and the user picks.
 */
export interface Chain {
  id: string;
  /** Shown in the shopping list header and the store link. */
  name: string;
  /** Street or centre, so the header names a place you can walk to. */
  area: string;
  /** Landing page for the chain's online store. */
  onlineUrl: string;
  /** The chain's page for this particular store, where one exists. */
  infoUrl?: string;
  /**
   * Deep link into the store's own search for one product. None of these chains
   * publish an "add to basket" URL, so search results are as far as we can take
   * you — from there it is one tap to the cart.
   */
  searchUrl: (term: string) => string;
}

export interface Region {
  id: RegionId;
  /** The region's own language. English is always available alongside it. */
  language: Language;
  currency: Currency;
  /** Departments in the order you physically walk this region's stores. */
  deptOrder: DeptId[];
  /** Department names in the region's own language. English lives in content.ts. */
  deptLabels: Record<DeptId, string>;
  chains: Chain[];
  ingredients: Ingredient[];
  recipes: Recipe[];
}

/**
 * Catches the two ways a hand-written region goes wrong: a department left out
 * of the walking order, so its items vanish from the shopping list, and a
 * duplicate, so they appear twice. Both are silent at the type level, because
 * `DeptId[]` is happy with any length.
 */
export function assertRegion(region: Region): void {
  const seen = new Set(region.deptOrder);
  if (seen.size !== region.deptOrder.length) {
    throw new Error(`Region ${region.id}: duplicate department in deptOrder`);
  }
  const missing = DEPT_IDS.filter((d) => !seen.has(d));
  if (missing.length > 0) {
    throw new Error(`Region ${region.id}: deptOrder is missing ${missing.join(', ')}`);
  }
  if (region.chains.length === 0) {
    throw new Error(`Region ${region.id}: needs at least one chain`);
  }
}
