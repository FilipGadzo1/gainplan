import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile, WeekPlan } from '../types';
import { householdFactor } from '../lib/nutrition';
import { buildShoppingList } from '../lib/shopping';
import { deptLabel, ingredientName, ingredientSubtitle } from '../i18n/content';
import { useCurrencyFormat, useHouseholdLabel, useLanguage, useNumberFormat } from '../i18n/hooks';
import { useShoppingFormat } from '../i18n/useShoppingFormat';
import { useRegion } from '../regions/context';
import { StoreLink, Pill } from './ui';
import ChainMark from './ChainMark';

export default function ShoppingView({
  plan,
  profile,
  checked,
  onCheckedChange,
}: {
  plan: WeekPlan;
  profile: Profile;
  checked: Set<string>;
  onCheckedChange: (s: Set<string>) => void;
}) {
  const { t } = useTranslation('shopping');
  const { t: tc } = useTranslation('common');
  const { language } = useLanguage();
  const nf = useNumberFormat();
  const householdLabel = useHouseholdLabel();
  const money = useCurrencyFormat();
  const { quantity, listText } = useShoppingFormat();
  const { region, chain } = useRegion();

  const factor = householdFactor(profile);
  const whom = householdLabel(profile);
  const list = useMemo(() => buildShoppingList(plan, region, factor), [plan, region, factor]);
  const [hideStaples, setHideStaples] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onCheckedChange(next);
  };

  const visibleGroups = list.groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !hideStaples || !i.ingredient.staple) }))
    .filter((g) => g.items.length > 0);

  const visibleIds = visibleGroups.flatMap((g) => g.items.map((i) => i.ingredient.id));
  const doneCount = visibleIds.filter((id) => checked.has(id)).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listText(list, whom));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none">
      <section className="card mb-4 p-4 sm:p-5">
        {/* No wrap: the basket count is the answer to "how far through am I",
            and wrapped underneath four pills on a phone it read as a footnote.
            The pills wrap inside the left column instead. */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <ChainMark chainId={chain.id} name={chain.name} className="size-5 text-[11px]" />
              {chain.name}
            </h2>
            <p className="text-xs text-[var(--color-muted)]">{chain.area}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="accent">{t('approxTotal', { amount: money(list.total) })}</Pill>
              <Pill>{t('items', { count: list.itemCount })}</Pill>
              <Pill tone="muted">{t('perDay', { amount: money(list.total / 7) })}</Pill>
              {factor > 1 && (
                <Pill>{t('portions', { label: whom, factor: nf(factor, 2) })}</Pill>
              )}
            </div>
          </div>
          <div className="tnum shrink-0 text-right">
            <div className="text-2xl font-bold">
              {doneCount}
              <span className="text-base text-[var(--color-muted)]">/{visibleIds.length}</span>
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">{t('inBasket')}</div>
          </div>
        </div>

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <a
            href={chain.onlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            {t('openStoreOnline', { store: chain.name })}
          </a>
          <button type="button" className="btn" onClick={copy}>
            {copied ? t('copied') : t('copyList')}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            {tc('actions.print')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setHideStaples((v) => !v)}
            aria-pressed={hideStaples}
          >
            {hideStaples ? t('showPantry') : t('hidePantry')}
          </button>
          {checked.size > 0 && (
            <button type="button" className="btn" onClick={() => onCheckedChange(new Set())}>
              {t('uncheckAll')}
            </button>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-muted)]">
          {t('disclaimer', { store: chain.name })}
        </p>
      </section>

      {/* Departments flow into columns on desktop so the list stops being one
          very long scroll. `break-inside-avoid` keeps a department intact. */}
      <div className="gap-4 lg:columns-2 2xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {visibleGroups.map((group) => (
          <section key={group.dept} className="card overflow-hidden">
            <h3 className="border-b border-[var(--color-line)] bg-[var(--color-raised)] px-4 py-2 text-xs font-bold tracking-wide uppercase">
              {deptLabel(group.dept, language, region)}
            </h3>
            <ul className="divide-y divide-[var(--color-line)]">
              {group.items.map((item) => {
                const isChecked = checked.has(item.ingredient.id);
                const boxId = `buy-${item.ingredient.id}`;
                // The name is a link to ICA, so it cannot sit inside a <label> —
                // clicking it would navigate *and* tick the box. The subtitle and
                // the price stay as labels to keep a decent-sized tap target.
                return (
                  <li key={item.ingredient.id} className="flex items-center gap-3 px-4 py-3">
                    <input
                      id={boxId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(item.ingredient.id)}
                      aria-label={`${ingredientName(item.ingredient, language)} — ${quantity(item)}`}
                      // Ticked one-handed, in a shop, holding a basket.
                      className="size-4 shrink-0 accent-[var(--color-accent)] pointer-coarse:size-6"
                    />
                    <span className={`min-w-0 flex-1 ${isChecked ? 'opacity-40' : ''}`}>
                      <span className="block text-sm font-semibold">
                        <StoreLink ingredient={item.ingredient} />
                        {item.ingredient.staple && (
                          <span className="ml-2 text-[10px] font-medium text-[var(--color-muted)]">
                            {t('checkAtHome')}
                          </span>
                        )}
                      </span>
                      <label
                        htmlFor={boxId}
                        className="block cursor-pointer text-[11px] text-[var(--color-muted)]"
                      >
                        <span className="italic">
                          {ingredientSubtitle(item.ingredient, language)}
                        </span>
                        {' · '}
                        {quantity(item)}
                      </label>
                    </span>
                    <label
                      htmlFor={boxId}
                      className={`tnum shrink-0 cursor-pointer text-sm font-semibold ${isChecked ? 'opacity-40' : ''}`}
                    >
                      {money(item.cost)}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
