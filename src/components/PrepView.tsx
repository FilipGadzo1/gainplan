import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile, Recipe, WeekPlan } from '../types';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';
import { sourceHost } from '../lib/shopping';
import { prepPlan, type PrepTask } from '../lib/planner';
import { householdFactor, recipeMacros } from '../lib/nutrition';
import { ingredientSubtitle, recipeName, recipeSteps, recipeSubtitle } from '../i18n/content';
import {
  useDayNames,
  useHouseholdLabel,
  useLanguage,
  useNumberFormat,
  useQuantityFormat,
} from '../i18n/hooks';
import { StoreLink, Pill } from './ui';

const taskKey = (t: PrepTask) => `${t.recipeId}-${t.dayIndex}`;

type StorageKey = 'storage.fish' | 'storage.saucy' | 'storage.default';

/**
 * Storage guidance derived from what is actually in the pan, rather than a
 * generic list the reader has to apply themselves.
 */
function storageAdviceKey(recipe: Recipe): StorageKey {
  const ids = new Set(recipe.ingredients.map((ri) => ri.id));
  const hasFish = recipe.ingredients.some((ri) => getIngredient(ri.id).tags.includes('fish'));
  const saucy = ids.has('krossadetomater') || ids.has('kokosmjolk') || ids.has('buljong');

  if (hasFish) return 'storage.fish';
  if (saucy) return 'storage.saucy';
  return 'storage.default';
}

export default function PrepView({
  plan,
  profile,
  onOpenRecipe,
}: {
  plan: WeekPlan;
  profile: Profile;
  onOpenRecipe: (recipeId: string, scale: number) => void;
}) {
  const { t } = useTranslation('prep');
  const { language } = useLanguage();
  const days = useDayNames();
  const nf = useNumberFormat();
  const householdLabel = useHouseholdLabel();

  const tasks = useMemo(() => prepPlan(plan), [plan]);
  const factor = householdFactor(profile);
  const whom = householdLabel(profile);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selected = tasks.find((task) => taskKey(task) === selectedKey) ?? tasks[0];

  const totalMinutes = tasks.reduce((s, task) => s + task.minutes, 0);
  const mealsCovered = tasks.reduce((s, task) => s + task.servings, 0);
  // Longest job first is the single most useful ordering hint on a prep day.
  const longest = tasks.reduce<PrepTask | null>(
    (best, task) => (!best || task.minutes > best.minutes ? task : best),
    null,
  );

  if (tasks.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center lg:h-full">
        <h2 className="text-base font-bold">{t('empty.title')}</h2>
        <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          {t('empty.body')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="card flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="tnum text-lg font-bold">{tasks.length}</span>
          <span className="text-xs text-[var(--color-muted)]">
            {t('cookSessions', { count: tasks.length })}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tnum text-lg font-bold">{mealsCovered}</span>
          <span className="text-xs text-[var(--color-muted)]">{t('mealsCovered')}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tnum text-lg font-bold">~{totalMinutes}</span>
          <span className="text-xs text-[var(--color-muted)]">{t('minutesTotal')}</span>
        </div>
        {factor > 1 && (
          <Pill>
            {whom} · {nf(factor, 2)}×
          </Pill>
        )}
        {longest && (
          <p className="ml-auto text-[11px] text-[var(--color-muted)]">
            {t('startWith')}{' '}
            <span className="font-semibold text-[var(--color-text)]">
              {recipeName(getRecipe(longest.recipeId), language)}
            </span>{' '}
            {t('startWithSuffix', { minutes: longest.minutes })}
          </p>
        )}
      </div>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(240px,300px)_1fr]">
        <aside className="card flex flex-col overflow-hidden">
          <h2 className="shrink-0 border-b border-[var(--color-line)] px-3 py-2 text-[11px] font-bold tracking-wide uppercase">
            {t('schedule')}
          </h2>
          <ul aria-label={t('schedule')} className="min-h-0 flex-1 overflow-y-auto p-2">
            {tasks.map((task, i) => {
              const recipe = getRecipe(task.recipeId);
              const key = taskKey(task);
              const isSelected = selected && taskKey(selected) === key;
              const newDay = i === 0 || tasks[i - 1].dayIndex !== task.dayIndex;

              return (
                <li key={key}>
                  {newDay && (
                    <div className="px-1 pt-2 pb-1 text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
                      {t('cookOn', { day: days.long[task.dayIndex] })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                        : 'border-transparent hover:border-[var(--color-line)]'
                    }`}
                  >
                    <span className="block text-[13px] leading-snug font-semibold">
                      {recipeName(recipe, language)}
                    </span>
                    <span className="tnum mt-0.5 block text-[10px] text-[var(--color-muted)]">
                      {t('meals', { count: task.servings })} · {t('approxMinutes', { minutes: task.minutes })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {selected && <SessionDetail task={selected} factor={factor} onOpenRecipe={onOpenRecipe} />}
      </div>
    </div>
  );
}

function SessionDetail({
  task,
  factor,
  onOpenRecipe,
}: {
  task: PrepTask;
  factor: number;
  onOpenRecipe: (recipeId: string, scale: number) => void;
}) {
  const { t } = useTranslation('prep');
  const { language } = useLanguage();
  const days = useDayNames();
  const nf = useNumberFormat();
  const fmt = useQuantityFormat();

  const recipe = getRecipe(task.recipeId);
  const macros = recipeMacros(recipe, task.totalScale);
  const title = recipeName(recipe, language);

  const ingredients = recipe.ingredients.map((ri) => ({
    ing: getIngredient(ri.id),
    // Seasonings scale with the number of meals; everything else with portion
    // size. Both then scale with the household.
    grams: (ri.fixed ? ri.g * task.servings : ri.g * task.totalScale) * factor,
  }));

  return (
    <section className="card flex min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[var(--color-line)] p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base leading-tight font-bold">{title}</h2>
            {recipeSubtitle(recipe, language) && (
              <p className="text-[11px] text-[var(--color-muted)] italic">
                {recipeSubtitle(recipe, language)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn no-print px-2.5 py-1 text-[11px]"
                title={t('recipeSource', { recipe: title, host: sourceHost(recipe.sourceUrl) })}
              >
                {sourceHost(recipe.sourceUrl)} ↗
              </a>
            )}
            <button
              type="button"
              className="btn px-2.5 py-1 text-[11px]"
              onClick={() => onOpenRecipe(task.recipeId, task.totalScale / task.servings)}
            >
              {t('fullRecipe')}
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill tone="accent">{t('cookOn', { day: days.long[task.dayIndex] })}</Pill>
          <Pill>{t('approxMinutes', { minutes: task.minutes })}</Pill>
          <Pill>
            {t('servings', {
              meals: t('meals', { count: task.servings }),
              portions:
                factor > 1
                  ? t('portionsFactor', { factor: nf(factor, 2) })
                  : t('portionsSingle'),
            })}
          </Pill>
          <Pill tone="muted">{t('kcalInPan', { kcal: Math.round(macros.kcal * factor) })}</Pill>
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted)]">
          {t('eatenOn')}{' '}
          <span className="font-semibold text-[var(--color-text)]">
            {task.eatenOn.map((d) => days.long[d]).join(', ')}
          </span>
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-3 md:grid-cols-2">
        <div className="flex min-h-0 flex-col">
          <h3 className="shrink-0 text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
            {t('cookThisMuch')}
          </h3>
          <ul aria-label={t('cookQuantities')} className="mt-1.5 min-h-0 flex-1 overflow-y-auto pr-1">
            {ingredients.map(({ ing, grams }) => (
              <li
                key={ing.id}
                className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line)] py-1.5 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">
                    <StoreLink ingredient={ing} />
                  </span>
                  {ingredientSubtitle(ing, language) && (
                    <span className="block truncate text-[10px] text-[var(--color-muted)] italic">
                      {ingredientSubtitle(ing, language)}
                    </span>
                  )}
                </span>
                <span className="tnum shrink-0 text-[13px] font-bold">
                  {ing.unitWeight && grams / ing.unitWeight >= 0.8
                    ? fmt.pieces(grams / ing.unitWeight)
                    : fmt.grams(grams)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col">
          <h3 className="shrink-0 text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
            {t('method')}
          </h3>
          <ol
            aria-label={t('method')}
            className="mt-1.5 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
          >
            {recipeSteps(recipe, language).map((step, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                <span className="tnum mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-raised)] text-[10px] font-bold text-[var(--color-accent)]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 shrink-0 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] p-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
            {t(storageAdviceKey(recipe))}
          </p>
        </div>
      </div>
    </section>
  );
}
