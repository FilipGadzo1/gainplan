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
 * The app ships Swedish and English. Swedish is the default because the whole
 * thing is built around a specific ICA store in Uppsala — the browser's own
 * locale is deliberately *not* consulted, so a visitor with an English browser
 * still lands on Swedish until they choose otherwise.
 */
export const LANGUAGES = ['sv', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'sv';

/** Versioned alongside the other gainplan.* keys in localStorage. */
export const LANGUAGE_STORAGE_KEY = 'gainplan.lang.v1';

export const defaultNS = 'common';

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
