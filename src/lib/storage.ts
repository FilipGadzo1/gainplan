import type { Profile, RegionId, WeekPlan } from '../types';
import { REGION_IDS } from '../types';
import { DEFAULT_REGION, regionOf } from '../regions/registry';

/**
 * Keys that hold the same thing whichever country you shop in — your body, your
 * goals, your weigh-ins.
 */
const KEYS = {
  profile: 'gainplan.profile.v1',
  weights: 'gainplan.weights.v1',
  showHousehold: 'gainplan.showHousehold.v1',
} as const;

/**
 * Keys that mean something different per region. A Swedish week and a Croatian
 * week are made of different recipes and bought in different shops, so they get
 * a namespace each and switching country leaves both intact.
 */
const REGION_KEYS = {
  plan: 'plan',
  checked: 'checked',
} as const;

const regionKey = (name: keyof typeof REGION_KEYS, region: RegionId) =>
  `gainplan.${REGION_KEYS[name]}.${region}.v1`;

/** What the same keys were called before regions existed. All of it was Swedish. */
const LEGACY_KEYS: Record<keyof typeof REGION_KEYS, string> = {
  plan: 'gainplan.plan.v1',
  checked: 'gainplan.checked.v1',
};

export const DEFAULT_PROFILE: Profile = {
  region: DEFAULT_REGION,
  chain: null,
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  goal: 'lean-bulk',
  trainingDays: [0, 2, 4],
  manualKcal: null,
  proteinPerKg: 2.0,
  fatPct: 0.27,
  calorieCycling: true,
  mealsPerDay: 4,
  exclude: [],
  maxMinutes: 45,
  useLeftovers: true,
  dislikedRecipes: [],
  household: [],
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota — the app still works, it just forgets.
  }
}

export function loadProfile(): Profile | null {
  const stored = read<Partial<Profile> | null>(KEYS.profile, null);
  if (!stored) return null;
  // Merge so a profile saved by an older build still opens. A profile from
  // before regions existed has no region and picks up the default, which is
  // right: everything written back then was Swedish.
  const merged = { ...DEFAULT_PROFILE, ...stored };
  return { ...merged, region: isRegionId(merged.region) ? merged.region : DEFAULT_REGION };
}

function isRegionId(value: unknown): value is RegionId {
  return typeof value === 'string' && (REGION_IDS as readonly string[]).includes(value);
}

export const saveProfile = (p: Profile) => write(KEYS.profile, p);

/**
 * Moves a pre-region value into the Swedish namespace, once. Runs before the
 * first read of each region-scoped key and is a no-op afterwards, including on
 * a browser that never held the old key.
 */
function migrateLegacy(name: keyof typeof REGION_KEYS): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEYS[name]);
    if (legacy === null) return;
    const target = regionKey(name, DEFAULT_REGION);
    if (localStorage.getItem(target) === null) localStorage.setItem(target, legacy);
    localStorage.removeItem(LEGACY_KEYS[name]);
  } catch {
    // Same as write(): a locked-down browser just starts fresh.
  }
}

/**
 * The stored week for a region, or null.
 *
 * A plan naming recipes the region does not have is discarded whole rather than
 * partially rendered. It should not happen — plans are namespaced per region —
 * but a hand-edited store or a recipe deleted between builds would otherwise
 * throw out of `getRecipe` somewhere deep in a view, and no week is easier to
 * recover from than a broken one.
 */
export function loadPlan(region: RegionId): WeekPlan | null {
  migrateLegacy('plan');
  const plan = read<WeekPlan | null>(regionKey('plan', region), null);
  if (!plan || !Array.isArray(plan.days)) return null;

  const known = new Set(regionOf(region).recipes.map((r) => r.id));
  return plan.days.every((day) =>
    Array.isArray(day?.meals) && day.meals.every((m) => known.has(m?.recipeId)),
  )
    ? plan
    : null;
}

export const savePlan = (region: RegionId, p: WeekPlan | null) =>
  write(regionKey('plan', region), p);

export function loadChecked(region: RegionId): Set<string> {
  migrateLegacy('checked');
  return new Set(read<string[]>(regionKey('checked', region), []));
}

export const saveChecked = (region: RegionId, s: Set<string>) =>
  write(regionKey('checked', region), [...s]);

export interface WeightEntry {
  date: string;
  kg: number;
}

export const loadWeights = () => read<WeightEntry[]>(KEYS.weights, []);
export const saveWeights = (w: WeightEntry[]) => write(KEYS.weights, w);

/** Whether quantities across the app are shown for the whole household. */
export const loadShowHousehold = () => read<boolean>(KEYS.showHousehold, false);
export const saveShowHousehold = (v: boolean) => write(KEYS.showHousehold, v);

export function resetAll(): void {
  for (const key of Object.values(KEYS)) localStorage.removeItem(key);
  for (const name of Object.keys(REGION_KEYS) as (keyof typeof REGION_KEYS)[]) {
    localStorage.removeItem(LEGACY_KEYS[name]);
    for (const region of REGION_IDS) localStorage.removeItem(regionKey(name, region));
  }
}
