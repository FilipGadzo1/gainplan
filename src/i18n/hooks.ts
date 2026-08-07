import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Currency, Profile } from '../types';
import { useRegion } from '../regions/context';
import { DEFAULT_LANGUAGE, isLanguage, type Language } from './index';

/** The active language, narrowed to the two the app actually ships. */
export function useLanguage(): {
  language: Language;
  setLanguage: (lang: Language) => void;
} {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const setLanguage = useCallback((lang: Language) => void i18n.changeLanguage(lang), [i18n]);
  return { language, setLanguage };
}

/**
 * Decimal separators differ (1.65× in English, 1,65× in Swedish), and every
 * call site wants a fixed number of decimals rather than Intl's default of
 * "up to three".
 */
export function useNumberFormat(): (value: number, decimals?: number) => string {
  const { language } = useLanguage();
  return useCallback(
    (value: number, decimals = 0) =>
      new Intl.NumberFormat(language, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value),
    [language],
  );
}

/**
 * Day names in three widths. Swedish abbreviations are not prefixes of the full
 * name in the way English ones happen to be ("Onsdag" → "Ons", "On"), so the
 * short forms are their own keys rather than a `.slice()`.
 */
export function useDayNames(): { long: string[]; short: string[]; min: string[] } {
  const { t } = useTranslation('common');
  return useMemo(
    () => ({
      long: [
        t('days.mon'),
        t('days.tue'),
        t('days.wed'),
        t('days.thu'),
        t('days.fri'),
        t('days.sat'),
        t('days.sun'),
      ],
      short: [
        t('daysShort.mon'),
        t('daysShort.tue'),
        t('daysShort.wed'),
        t('daysShort.thu'),
        t('daysShort.fri'),
        t('daysShort.sat'),
        t('daysShort.sun'),
      ],
      min: [
        t('daysMin.mon'),
        t('daysMin.tue'),
        t('daysMin.wed'),
        t('daysMin.thu'),
        t('daysMin.fri'),
        t('daysMin.sat'),
        t('daysMin.sun'),
      ],
    }),
    [t],
  );
}

/**
 * "Du" / "Du + Anna" / "Du + 2 andra", for labelling cook quantities. This used
 * to live in nutrition.ts; it moved here so that module stays free of display
 * text while `householdFactor` — which is arithmetic — stayed put.
 */
export function useHouseholdLabel(): (profile: Profile) => string {
  const { t } = useTranslation('common');
  return useCallback(
    (profile: Profile) => {
      if (profile.household.length === 0) return t('household.you');
      if (profile.household.length === 1) {
        const name = profile.household[0].name.trim();
        return name ? t('household.youPlusName', { name }) : t('household.youPlusOne');
      }
      return t('household.youPlusMany', { count: profile.household.length });
    },
    [t],
  );
}

/**
 * Symbols rather than Intl's `style: 'currency'`, which renders SEK as "SEK 850"
 * in English and "850,00 kr" in Swedish — neither is what the app has always
 * shown, and both put the currency where a shopper does not read it. Every
 * currency here happens to suffix, so one shape covers both.
 */
const CURRENCY_SYMBOL: Record<Currency, string> = { SEK: 'kr', EUR: '€', AED: 'AED' };

/**
 * A money amount in the current region's currency, rounded to whole units. Prices
 * are shelf estimates to begin with, so decimals would claim a precision the
 * underlying data does not have.
 */
export function useCurrencyFormat(): (amount: number) => string {
  const { region } = useRegion();
  const nf = useNumberFormat();
  return useCallback(
    (amount: number) => `${nf(Math.round(amount))} ${CURRENCY_SYMBOL[region.currency]}`,
    [nf, region.currency],
  );
}

/**
 * Grams, or whole units where the ingredient is counted rather than weighed
 * ("3 st" / "3 pcs"). Shared by the week, prep and recipe views.
 */
export function useQuantityFormat(): {
  grams: (g: number) => string;
  pieces: (count: number) => string;
} {
  const { t } = useTranslation('common');
  const nf = useNumberFormat();
  return useMemo(
    () => ({
      grams: (g: number) =>
        g >= 1000
          ? `${nf(g / 1000, 1).replace(/[.,]0$/, '')} ${t('units.kilogram')}`
          : `${nf(Math.round(g))} ${t('units.gram')}`,
      pieces: (count: number) => `${nf(Math.round(count))} ${t('units.pieces')}`,
    }),
    [nf, t],
  );
}
