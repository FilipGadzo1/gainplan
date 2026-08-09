import type { Currency, DeptId, Ingredient, Recipe, RegionId } from '../types';
import { DEPT_IDS } from '../types';
import type { Language } from '../i18n';

/**
 * A region is everywhere the app has to know *where you shop* rather than *what
 * you eat*. Departments, their walking order, the chains, the currency and the
 * catalogue all differ between countries; macro maths and portion optimisation
 * do not, and stay out of here.
 *
 * The rule that makes this tractable: a region offers at most one non-English
 * *interface* language — its `language` field, `'en'` meaning it offers none —
 * and the accessors in i18n/content.ts only ever ask "English or not", never
 * which region produced the row they were handed.
 *
 * `language` is about the interface, not the data. A region's own data files
 * can still be written in another language even when `language` is `'en'` —
 * Croatia is exactly that: `language: 'en'`, because its interface translation
 * was retired, while `hr/ingredients.ts` and `hr/recipes.ts` are still written
 * in Croatian throughout. `deptLabels` (below) is only ever reached for a
 * region that *does* offer a non-English interface.
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
   *
   * Optional, because not every chain has one to link to. Spar and Plodine
   * render their sites client-side and expose no URL that carries a search
   * term, so their ingredients show as plain text rather than as a link that
   * would land you on a page that has not heard of the thing you wanted.
   */
  searchUrl?: (term: string) => string;
}

export interface Region {
  id: RegionId;
  /**
   * The non-English interface language this region offers, or `'en'` if it
   * offers none. English is always available alongside it. This is about the
   * interface, not the data — a region can still hold non-English data (names,
   * pack descriptions, recipe steps) while declaring `language: 'en'`; see the
   * note above.
   */
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
