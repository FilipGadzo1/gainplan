import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlannedDay, PlannedMeal, Profile, WeekPlan } from '../types';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';
import { dayMacros, mealMacros } from '../lib/planner';
import { householdFactor } from '../lib/nutrition';
import { recipeName, recipeSubtitle } from '../i18n/content';
import {
  useDayNames,
  useHouseholdLabel,
  useLanguage,
  useNumberFormat,
  useQuantityFormat,
} from '../i18n/hooks';
import { StoreLink, MacroBar, Pill, SegmentedTabs, TargetDelta } from './ui';

const SLOT_KEY = {
  breakfast: 'slots.breakfast',
  lunch: 'slots.lunch',
  dinner: 'slots.dinner',
  snack: 'slots.snack',
} as const satisfies Record<PlannedMeal['slot'], string>;

/** One column per meal, so the whole day fits the width without wrapping. */
const MEAL_COLUMNS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};

/** Monday-first index of today, used to pick the day shown on first load. */
function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

/**
 * Master/detail: a always-visible strip of seven day tiles, and the selected
 * day's meals laid out as full-height columns beneath it.
 *
 * The previous version tried to show all seven days at full detail at once,
 * which only fit by shrinking everything and adding per-card scrollbars. Showing
 * one day at a time means each meal gets enough room for its full ingredient
 * list, and nothing scrolls on desktop.
 */
export default function WeekView({
  plan,
  profile,
  showHousehold,
  onShowHouseholdChange,
  onSwap,
  onToggleLock,
  onScale,
  onOpenRecipe,
  onRebalance,
}: {
  plan: WeekPlan;
  profile: Profile;
  showHousehold: boolean;
  onShowHouseholdChange: (v: boolean) => void;
  onSwap: (day: number, meal: number) => void;
  onToggleLock: (day: number, meal: number) => void;
  onScale: (day: number, meal: number, scale: number) => void;
  onOpenRecipe: (recipeId: string, scale: number) => void;
  onRebalance: () => void;
}) {
  const { t } = useTranslation('week');
  const { t: tc } = useTranslation('common');
  const nf = useNumberFormat();
  const householdLabel = useHouseholdLabel();

  const [selected, setSelected] = useState(todayIndex);
  const factor = householdFactor(profile);
  const label = householdLabel(profile);
  const household = factor > 1 && showHousehold;

  const day = plan.days[selected] ?? plan.days[0];

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
        {factor > 1 && (
          <SegmentedTabs
            value={household ? 'household' : 'you'}
            onChange={(v) => onShowHouseholdChange(v === 'household')}
            options={[
              { value: 'you', label: t('scope.yourPlate') },
              { value: 'household', label: t('scope.household', { label, factor: nf(factor, 2) }) },
            ]}
          />
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn" onClick={onRebalance}>
            {t('rebalance')}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            {tc('actions.print')}
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-2 sm:grid-cols-7">
        {plan.days.map((d) => (
          <DayTile
            key={d.index}
            day={d}
            selected={d.index === selected}
            onSelect={() => setSelected(d.index)}
          />
        ))}
      </div>

      <div
        className={`grid gap-3 lg:min-h-0 lg:flex-1 ${MEAL_COLUMNS[day.meals.length] ?? 'lg:grid-cols-4'}`}
      >
        {day.meals.map((meal, i) => (
          <MealCard
            key={`${day.index}-${meal.slot}-${i}`}
            meal={meal}
            factor={household ? factor : 1}
            onSwap={() => onSwap(day.index, i)}
            onToggleLock={() => onToggleLock(day.index, i)}
            onScale={(s) => onScale(day.index, i, s)}
            onOpen={() => onOpenRecipe(meal.recipeId, meal.scale)}
          />
        ))}
      </div>
    </div>
  );
}

function DayTile({
  day,
  selected,
  onSelect,
}: {
  day: PlannedDay;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation('week');
  const days = useDayNames();
  const total = dayMacros(day);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={`rounded-xl border p-2.5 text-left transition-colors ${
        selected
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
          : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-muted)]'
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className={`text-xs font-bold ${selected ? 'text-[var(--color-accent)]' : ''}`}>
          {days.short[day.index]}
        </span>
        {day.training && (
          <span
            className="size-1.5 rounded-full bg-[var(--color-accent)]"
            title={t('trainingDay')}
            aria-label={t('trainingDay')}
          />
        )}
      </div>
      <div className="tnum mt-1 text-sm leading-none font-bold">{Math.round(total.kcal)}</div>
      <div className="tnum text-[10px] text-[var(--color-muted)]">
        / {day.target.kcal} <TargetDelta actual={total.kcal} target={day.target.kcal} />
      </div>
      <div className="mt-1.5">
        <MacroBar macros={total} barOnly />
      </div>
    </button>
  );
}

function MealCard({
  meal,
  factor,
  onSwap,
  onToggleLock,
  onScale,
  onOpen,
}: {
  meal: PlannedMeal;
  factor: number;
  onSwap: () => void;
  onToggleLock: () => void;
  onScale: (scale: number) => void;
  onOpen: () => void;
}) {
  const { t } = useTranslation('week');
  const { t: tc } = useTranslation('common');
  const { language } = useLanguage();
  const days = useDayNames();
  const fmt = useQuantityFormat();

  const recipe = getRecipe(meal.recipeId);
  const macros = mealMacros(meal);

  // There is room for the whole ingredient list now, so the week page is enough
  // to cook from — the recipe popup is only needed for the method.
  const ingredients = recipe.ingredients.map((ri) => ({
    ing: getIngredient(ri.id),
    grams: (ri.fixed ? ri.g : ri.g * meal.scale) * factor,
  }));

  return (
    <section className="card flex flex-col overflow-hidden p-3">
      <header className="flex shrink-0 items-center gap-1.5">
        <span className="text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
          {t(SLOT_KEY[meal.slot])}
        </span>
        {meal.leftoverFromDay !== undefined && (
          <Pill tone="accent">↻ {days.short[meal.leftoverFromDay]}</Pill>
        )}
        <span className="ml-auto text-[11px] text-[var(--color-muted)]">
          {recipe.minutes} {tc('units.minutes')}
        </span>
      </header>

      <button
        type="button"
        onClick={onOpen}
        className="mt-1.5 shrink-0 text-left hover:text-[var(--color-accent)]"
      >
        <span className="block text-sm leading-snug font-bold">{recipeName(recipe, language)}</span>
        <span className="block text-[11px] leading-snug text-[var(--color-muted)] italic">
          {recipeSubtitle(recipe, language)}
        </span>
      </button>

      <div className="mt-2 shrink-0">
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-xl leading-none font-bold">{Math.round(macros.kcal)}</span>
          <span className="text-[11px] text-[var(--color-muted)]">{tc('units.kcal')}</span>
        </div>
        <div className="mt-1.5">
          <MacroBar macros={macros} compact />
        </div>
      </div>

      <div className="mt-2.5 min-h-0 flex-1 overflow-hidden">
        <div className="text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
          {factor > 1 ? t('cookWholePan') : t('ingredients')}
        </div>
        <ul className="mt-1 flex flex-col">
          {ingredients.map(({ ing, grams }) => (
            <li key={ing.id} className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
              <StoreLink ingredient={ing} className="truncate" />
              <span className="tnum shrink-0 font-semibold">
                {ing.unitWeight && grams / ing.unitWeight >= 0.8
                  ? fmt.pieces(grams / ing.unitWeight)
                  : fmt.grams(grams)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="no-print mt-2 flex shrink-0 items-center gap-1 border-t border-[var(--color-line)] pt-2">
        <IconButton label={t('smallerPortion')} onClick={() => onScale(meal.scale - 0.05)}>
          −
        </IconButton>
        <span className="tnum w-10 text-center text-[11px] font-bold text-[var(--color-muted)]">
          {Math.round(meal.scale * 100)}%
        </span>
        <IconButton label={t('biggerPortion')} onClick={() => onScale(meal.scale + 0.05)}>
          +
        </IconButton>

        <button
          type="button"
          onClick={onSwap}
          className="ml-auto rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] font-semibold text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          {t('swap')}
        </button>
        <button
          type="button"
          onClick={onToggleLock}
          aria-pressed={!!meal.locked}
          aria-label={t('lock')}
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
            meal.locked
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {meal.locked ? '🔒' : t('lock')}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] font-semibold text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          {t('recipe')}
        </button>
      </div>
    </section>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="size-6 rounded-md border border-[var(--color-line)] text-sm leading-none font-bold text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
    >
      {children}
    </button>
  );
}
