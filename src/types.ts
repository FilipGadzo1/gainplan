/** Core domain types. Macros are always grams; energy always kcal. */

/** ICA store departments, in the order you physically walk the store. */
export type Dept =
  | 'Frukt & Grönt'
  | 'Kött & Chark'
  | 'Fisk'
  | 'Mejeri & Ägg'
  | 'Bröd'
  | 'Skafferi'
  | 'Fryst';

export const DEPT_ORDER: Dept[] = [
  'Frukt & Grönt',
  'Kött & Chark',
  'Fisk',
  'Mejeri & Ägg',
  'Bröd',
  'Fryst',
  'Skafferi',
];

/** Restrictions a user can switch on. A recipe is excluded if it contains any flagged tag. */
export type DietTag =
  | 'meat'
  | 'pork'
  | 'fish'
  | 'dairy'
  | 'lactose'
  | 'egg'
  | 'gluten'
  | 'nuts'
  | 'soy';

export interface Ingredient {
  id: string;
  /** Swedish name, matching how it is labelled at ICA. */
  name: string;
  /** English name, shown as a subtitle. */
  en: string;
  dept: Dept;
  /** Per 100 g (or per 100 ml for liquids). */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Approximate ICA shelf price in SEK per kg/litre. */
  pricePerKg: number;
  /** Grams in the pack size you actually buy. */
  packSize: number;
  /** How the pack is described on the shelf, in Swedish, e.g. "påse 1 kg". */
  packName: string;
  /** The same pack description in English, e.g. "bag 1 kg". */
  packNameEn: string;
  /** Grams per piece, for things counted in units (egg, banana). */
  unitWeight?: number;
  /** Pantry item — you probably already have it, and one pack lasts months. */
  staple?: boolean;
  /**
   * Search term for the ICA Handla Online deep link. Defaults to `name`, which
   * is usually right — set it where the display name is more specific than what
   * ICA's search wants ("Kvarg naturell 0,2%" finds nothing, "kvarg" finds it).
   */
  icaQuery?: string;
  tags: DietTag[];
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface RecipeIngredient {
  id: string;
  /** Grams for one serving. */
  g: number;
  /** Seasonings and aromatics stay constant when the portion is scaled. */
  fixed?: boolean;
}

export interface Recipe {
  id: string;
  /** Swedish title, shown as the primary name. */
  name: string;
  /** English title, shown underneath it. */
  en: string;
  slots: MealSlot[];
  /** Hands-on + cooking minutes for one serving's worth of work. */
  minutes: number;
  /** Cooks well in bulk and keeps 3-4 days in the fridge. */
  batchFriendly: boolean;
  /** Quantities are always per single serving; the planner scales from here. */
  ingredients: RecipeIngredient[];
  /** Method in English. Reach for these through `recipeSteps()`, not directly. */
  steps: string[];
  /** Method in Swedish, same number of steps as `steps`. */
  stepsSv: string[];
  /**
   * The ICA recipe page this dish is based on, where one exists. Ours are
   * rewritten around gram-accurate macros, so treat it as "the same dish at
   * ICA", not as the source of these quantities. Most recipes have no match and
   * simply leave it unset.
   */
  sourceUrl?: string;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Sex = 'male' | 'female';
export type Goal = 'cut' | 'maintain' | 'lean-bulk' | 'bulk';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

/**
 * Someone else you cook for. They eat the same meals you do, just a different
 * amount of them — `portionFactor` is their plate as a share of yours, so a
 * partner who needs ~1900 kcal against your 3000 sits around 0.65.
 *
 * Their portion never changes your macro targets: the week is still planned
 * around your plate. It changes how much food gets cooked and bought.
 */
export interface HouseholdMember {
  id: string;
  name: string;
  /** Share of your portion size. */
  portionFactor: number;
}

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** Sessions per week; drives which days get the training-day calorie bump. */
  trainingDays: number[];
  /** Override the calculated target. null = use the calculation. */
  manualKcal: number | null;
  /** Grams of protein per kg bodyweight. */
  proteinPerKg: number;
  /** Share of calories from fat, 0-1. */
  fatPct: number;
  /** Shift calories between training and rest days without changing the weekly total. */
  calorieCycling: boolean;
  mealsPerDay: 3 | 4 | 5;
  /** Diet tags to exclude. */
  exclude: DietTag[];
  /** Max minutes of cooking per meal. */
  maxMinutes: number;
  /** Reuse batch-cooked dinners as later meals. */
  useLeftovers: boolean;
  dislikedRecipes: string[];
  /** Everyone you cook for besides yourself. */
  household: HouseholdMember[];
}

export interface PlannedMeal {
  slot: MealSlot;
  recipeId: string;
  /** Portion multiplier against one base serving. */
  scale: number;
  /** Set when this portion comes from a batch cooked on an earlier day. */
  leftoverFromDay?: number;
  /** Locked meals survive a regenerate. */
  locked?: boolean;
}

export interface PlannedDay {
  /** 0 = Monday. */
  index: number;
  training: boolean;
  target: Macros;
  meals: PlannedMeal[];
}

export interface WeekPlan {
  createdAt: number;
  days: PlannedDay[];
}

export interface ShoppingItem {
  ingredient: Ingredient;
  /** Total grams the plan calls for. */
  grams: number;
  /** Whole packs to buy. */
  packs: number;
  /** Grams actually purchased (packs x packSize). */
  boughtGrams: number;
  costSek: number;
}

export interface ShoppingList {
  groups: { dept: Dept; items: ShoppingItem[] }[];
  totalSek: number;
  itemCount: number;
}
