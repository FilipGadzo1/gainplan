import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import svCommon from './locales/sv/common.json';
import svSetup from './locales/sv/setup.json';
import svWeek from './locales/sv/week.json';
import svShopping from './locales/sv/shopping.json';
import svPrep from './locales/sv/prep.json';
import svRecipe from './locales/sv/recipe.json';

import enCommon from './locales/en/common.json';
import enSetup from './locales/en/setup.json';
import enWeek from './locales/en/week.json';
import enShopping from './locales/en/shopping.json';
import enPrep from './locales/en/prep.json';
import enRecipe from './locales/en/recipe.json';

/**
 * Every language the app ships. Which of them you are actually offered depends
 * on your region — see `languagesFor` — because a region's food data is written
 * in at most one non-English language, and a Swedish interface listing Emirati
 * products would be worse than either language on its own.
 *
 * English is the default even though Sweden is the default region. The two used
 * to agree, and it read as tidy until the app grew a region whose own language
 * *is* English: at that point "default country" and "default language" are
 * simply different questions, and the second one wants the answer more readers
 * can act on.
 *
 * The browser's own locale is deliberately still not consulted, so the landing
 * language is a property of the app rather than of the visitor's machine.
 */
export const LANGUAGES = ['sv', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/** Versioned alongside the other gainplan.* keys in localStorage. */
export const LANGUAGE_STORAGE_KEY = 'gainplan.lang.v1';

export const defaultNS = 'common';

/**
 * The languages on offer in a region: its own, plus English. English is kept
 * everywhere on purpose — it is the shared fallback, and someone reading the
 * plan in English still shops off local-language shelf names, which the data
 * carries alongside.
 */
export function languagesFor(regionLanguage: Language): Language[] {
  return regionLanguage === 'en' ? ['en'] : [regionLanguage, 'en'];
}

export const resources = {
  sv: {
    common: svCommon,
    setup: svSetup,
    week: svWeek,
    shopping: svShopping,
    prep: svPrep,
    recipe: svRecipe,
  },
  en: {
    common: enCommon,
    setup: enSetup,
    week: enWeek,
    shopping: enShopping,
    prep: enPrep,
    recipe: enRecipe,
  },
} as const;

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    ns: ['common', 'setup', 'week', 'shopping', 'prep', 'recipe'],
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES,
    // Only a stored choice counts. Without this the detector would fall through
    // to navigator.language and hand an English browser an English first load.
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    interpolation: {
      // React already escapes everything it renders.
      escapeValue: false,
    },
  });

export default i18n;
