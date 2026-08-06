import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';
import { sourceHost } from '../lib/shopping';
import { macrosForGrams, recipeCost, recipePackCost, recipeMacros } from '../lib/nutrition';
import { ingredientSubtitle, recipeName, recipeSteps, recipeSubtitle } from '../i18n/content';
import { useCurrencyFormat, useLanguage, useNumberFormat, useQuantityFormat } from '../i18n/hooks';
import { StoreLink, MacroBar, Pill } from './ui';

export default function RecipeModal({
  recipeId,
  scale,
  householdFactor,
  householdLabel,
  defaultShowHousehold,
  onClose,
  onBlock,
  blocked,
}: {
  recipeId: string;
  scale: number;
  householdFactor: number;
  householdLabel: string;
  /** Follows the Week tab's switch, so the two views agree when you drill in. */
  defaultShowHousehold: boolean;
  onClose: () => void;
  onBlock: (recipeId: string) => void;
  blocked: boolean;
}) {
  const { t } = useTranslation('recipe');
  const { t: tc } = useTranslation('common');
  const { language } = useLanguage();
  const nf = useNumberFormat();
  const money = useCurrencyFormat();
  const fmt = useQuantityFormat();

  const recipe = getRecipe(recipeId);
  const title = recipeName(recipe, language);
  const cooksForOthers = householdFactor > 1;
  // Ingredient amounts can be read as your plate or as the whole pan.
  const [showHousehold, setShowHousehold] = useState(defaultShowHousehold && cooksForOthers);
  const quantityFactor = showHousehold ? householdFactor : 1;

  // Macros always describe your portion — they are your targets, not the pan's.
  const macros = recipeMacros(recipe, scale);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-b-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <div>
            <h2 className="text-lg leading-tight font-bold">{title}</h2>
            <p className="mt-0.5 text-xs text-[var(--color-muted)] italic">
              {recipeSubtitle(recipe, language)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="accent">{t('portion', { pct: Math.round(scale * 100) })}</Pill>
              <Pill>
                {recipe.minutes} {tc('units.minutes')}
              </Pill>
              {recipe.batchFriendly && <Pill>{t('batchFriendly')}</Pill>}
              <Pill tone="muted">
                {t('approxCost', {
                  amount: money(recipeCost(recipe, scale, quantityFactor)),
                })}
              </Pill>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc('actions.close')}
            className="shrink-0 rounded-md border border-[var(--color-line)] px-2.5 py-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="tnum text-2xl font-bold">{Math.round(macros.kcal)}</span>
            <span className="text-sm text-[var(--color-muted)]">{t('kcalInYourPortion')}</span>
          </div>
          <MacroBar macros={macros} />

          <div className="mt-6 mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold tracking-wide uppercase">{t('ingredients')}</h3>
            {cooksForOthers && (
              <div className="no-print flex gap-1">
                <QuantityTab active={!showHousehold} onClick={() => setShowHousehold(false)}>
                  {t('yourPortion')}
                </QuantityTab>
                <QuantityTab active={showHousehold} onClick={() => setShowHousehold(true)}>
                  {t('householdTab', { label: householdLabel, factor: nf(householdFactor, 2) })}
                </QuantityTab>
              </div>
            )}
          </div>
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {recipe.ingredients.map((ri) => {
              const ing = getIngredient(ri.id);
              const grams = (ri.fixed ? ri.g : ri.g * scale) * quantityFactor;
              const m = macrosForGrams(ing, grams);
              return (
                <li key={ri.id} className="flex items-baseline justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <StoreLink ingredient={ing} className="text-sm font-medium" />
                    <span className="block text-[11px] text-[var(--color-muted)] italic">
                      {ingredientSubtitle(ing, language)}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="tnum text-sm font-semibold">
                      {ing.unitWeight && grams / ing.unitWeight >= 0.8
                        ? fmt.pieces(grams / ing.unitWeight)
                        : fmt.grams(grams)}
                    </span>
                    <span className="tnum block text-[11px] text-[var(--color-muted)]">
                      {Math.round(m.kcal)} {tc('units.kcal')} · {Math.round(m.protein)}
                      {tc('macros.proteinShort').toLowerCase()}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/*
           * Two numbers because the app genuinely charges two ways, and showing
           * only one of them made the meal cost look wrong against the shopping
           * list. Both follow the your-portion / whole-pan toggle above.
           */}
          <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] p-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span className="tnum font-semibold">
                {t('costIngredients', {
                  amount: money(recipeCost(recipe, scale, quantityFactor)),
                })}
              </span>
              <span aria-hidden className="text-[var(--color-muted)]">
                ·
              </span>
              <span className="tnum font-semibold text-[var(--color-muted)]">
                {t('costPacks', {
                  amount: money(recipePackCost(recipe, scale, quantityFactor)),
                })}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
              {t('costNote')}
            </p>
          </div>

          <h3 className="mt-6 mb-2 text-xs font-bold tracking-wide uppercase">{t('method')}</h3>
          <ol className="flex flex-col gap-2.5">
            {recipeSteps(recipe, language).map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="tnum mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-raised)] text-[11px] font-bold text-[var(--color-accent)]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {recipe.sourceUrl && (
            <p className="no-print mt-4 text-[11px] text-[var(--color-muted)]">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-accent)] hover:underline"
              >
                {t('sameDishAtSource', { host: sourceHost(recipe.sourceUrl) })}
              </a>{' '}
              {t('sameDishSuffix')}
            </p>
          )}

          {cooksForOthers && showHousehold && (
            <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] p-2.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
              {t('householdNote', { label: householdLabel.toLowerCase() })}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              onBlock(recipe.id);
              onClose();
            }}
            className="mt-6 w-full rounded-lg border border-[var(--color-line)] px-3 py-2.5 text-sm font-semibold text-[var(--color-muted)] hover:border-[var(--color-fat)] hover:text-[var(--color-fat)]"
          >
            {blocked ? t('unblockRecipe') : t('blockRecipe')}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuantityTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
          : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {children}
    </button>
  );
}
