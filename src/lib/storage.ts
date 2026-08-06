import type { Profile, WeekPlan } from '../types';

const KEYS = {
  profile: 'gainplan.profile.v1',
  plan: 'gainplan.plan.v1',
  checked: 'gainplan.checked.v1',
  weights: 'gainplan.weights.v1',
  showHousehold: 'gainplan.showHousehold.v1',
} as const;

export const DEFAULT_PROFILE: Profile = {
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
  // Merge so a profile saved by an older build still opens.
  return { ...DEFAULT_PROFILE, ...stored };
}

export const saveProfile = (p: Profile) => write(KEYS.profile, p);

export const loadPlan = () => read<WeekPlan | null>(KEYS.plan, null);
export const savePlan = (p: WeekPlan | null) => write(KEYS.plan, p);

export const loadChecked = () => new Set(read<string[]>(KEYS.checked, []));
export const saveChecked = (s: Set<string>) => write(KEYS.checked, [...s]);

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
}
