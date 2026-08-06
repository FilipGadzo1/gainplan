import type { ReactNode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '../types';
import { DEFAULT_PROFILE } from '../lib/storage';
import { generatePlan } from '../lib/planner';
import { buildShoppingList } from '../lib/shopping';
import { RECIPES } from '../data/recipes';
import { INGREDIENTS, getIngredient } from '../data/ingredients';
import { SWEDEN } from '../regions/se';
import i18n, { DEFAULT_LANGUAGE, LANGUAGES, resources, type Language } from './index';
import { deptLabel, packName, recipeName, recipeSteps, recipeSubtitle } from './content';
import { useCurrencyFormat, useHouseholdLabel, useNumberFormat, useQuantityFormat } from './hooks';
import { useShoppingFormat } from './useShoppingFormat';

const profile = (over: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...over });
const ANNA = { id: 'w', name: 'Anna', portionFactor: 0.65 };
const KID = { id: 'k', name: 'Elis', portionFactor: 0.4 };

/** Renders a hook with the language forced, since i18n is a module singleton. */
async function withLanguage<T>(lang: Language, hook: () => T) {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  return renderHook(hook, { wrapper: ({ children }: { children: ReactNode }) => <>{children}</> });
}

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});
afterEach(cleanup);

describe('locale resources', () => {
  /** Every leaf key path in an object, e.g. "activity.light.hint". */
  function paths(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null) return [prefix];
    return Object.entries(value).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k));
  }

  /** Every leaf string in an object, paired with its path for error messages. */
  function leaves(value: unknown, prefix = ''): [string, unknown][] {
    if (typeof value !== 'object' || value === null) return [[prefix, value]];
    return Object.entries(value).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  }

  it('defaults to Swedish', () => {
    expect(DEFAULT_LANGUAGE).toBe('sv');
    expect(i18n.resolvedLanguage).toBe('sv');
  });

  it('has the same keys in every language', () => {
    // Plural suffixes are language property, not a key difference: Croatian
    // needs a _few form that neither Swedish nor English has, and English
    // needs no _few. Comparing the stems is what actually catches a key that
    // was added to one bundle and forgotten in another.
    const stems = (value: unknown) =>
      [...new Set(paths(value).map((p) => p.replace(/_(one|two|few|many|other)$/, '')))].sort();

    const namespaces = Object.keys(resources.sv) as (keyof typeof resources.sv)[];
    for (const ns of namespaces) {
      const sv = stems(resources.sv[ns]);
      for (const lang of LANGUAGES) {
        expect(stems(resources[lang][ns]), `${lang}, namespace "${ns}"`).toEqual(sv);
      }
    }
  });

  it('gives every plural key the forms its language actually needs', () => {
    // i18next picks a suffix by CLDR category. A missing one falls back to the
    // key itself, which renders as raw text like "items_few" on screen.
    const required: Record<Language, string[]> = {
      sv: ['one', 'other'],
      en: ['one', 'other'],
      hr: ['one', 'few', 'other'],
    };

    for (const lang of LANGUAGES) {
      for (const [ns, bundle] of Object.entries(resources[lang])) {
        const all = paths(bundle);
        const plurals = new Set(
          all.filter((p) => /_(one|two|few|many|other)$/.test(p)).map((p) => p.replace(/_\w+$/, '')),
        );
        for (const stem of plurals) {
          for (const form of required[lang]) {
            expect(all, `${lang}:${ns}.${stem} needs _${form}`).toContain(`${stem}_${form}`);
          }
        }
      }
    }
  });

  it('leaves no value empty or untranslated in either language', () => {
    for (const lang of LANGUAGES) {
      for (const [ns, bundle] of Object.entries(resources[lang])) {
        for (const [path, value] of leaves(bundle)) {
          expect(typeof value, `${lang}:${ns}.${path}`).toBe('string');
          expect((value as string).trim(), `${lang}:${ns}.${path}`).not.toBe('');
        }
      }
    }
  });

  it('does not leave a Swedish string sitting in the English bundle', () => {
    // Interface text only — proper nouns like "ICA Handla Online" are fine, so
    // this looks for the letters that only occur in Swedish words.
    const swedishOnly = /[åäöÅÄÖ]/;
    // Swedish place and product names stay Swedish in English copy.
    const allowed = new Set([
      'app.tagline',
      'app.description',
      'intro.body',
      'language.sv',
    ]);

    for (const [ns, bundle] of Object.entries(resources.en)) {
      for (const [path, value] of leaves(bundle)) {
        if (allowed.has(path)) continue;
        expect(swedishOnly.test(value as string), `en:${ns}.${path} = "${value}"`).toBe(false);
      }
    }
  });

  it('translates the chrome rather than leaving English in place', () => {
    expect(i18n.getFixedT('sv', 'setup')('measurements.title')).toBe('Mått');
    expect(i18n.getFixedT('en', 'setup')('measurements.title')).toBe('Measurements');
  });
});

describe('content accessors', () => {
  it('swaps recipe titles and methods with the language', () => {
    const recipe = RECIPES.find((r) => r.id === 'overnight-oats-kvarg')!;

    expect(recipeName(recipe, 'sv')).toBe(recipe.name);
    expect(recipeName(recipe, 'en')).toBe(recipe.en);
    expect(recipeSteps(recipe, 'sv')).toEqual(recipe.stepsLocal);
    expect(recipeSteps(recipe, 'en')).toEqual(recipe.steps);
  });

  it('keeps the other language available as a subtitle in both directions', () => {
    const recipe = RECIPES[0];
    expect(recipeSubtitle(recipe, 'sv')).toBe(recipe.en);
    expect(recipeSubtitle(recipe, 'en')).toBe(recipe.name);
  });

  it('swaps pack descriptions and departments', () => {
    const egg = getIngredient('agg');
    expect(packName(egg, 'sv')).toBe('kartong 12 st');
    expect(packName(egg, 'en')).toBe('carton of 12');

    expect(deptLabel('produce', 'sv', SWEDEN)).toBe('Frukt & Grönt');
    expect(deptLabel('produce', 'en', SWEDEN)).toBe('Fruit & Veg');
  });

  it('has both a Swedish and an English name for every department in use', () => {
    for (const ing of Object.values(INGREDIENTS)) {
      const sv = deptLabel(ing.dept, 'sv', SWEDEN);
      const en = deptLabel(ing.dept, 'en', SWEDEN);
      expect(sv, ing.dept).not.toBe('');
      expect(en, ing.dept).not.toBe('');
      // Neither label may leak the id through as its own display text.
      expect(sv, ing.dept).not.toBe(ing.dept);
      expect(en, ing.dept).not.toBe(ing.dept);
    }
  });
});

describe('number and quantity formatting', () => {
  it('uses the decimal separator of the language', async () => {
    const sv = await withLanguage('sv', () => useNumberFormat());
    expect(sv.result.current(1.65, 2)).toBe('1,65');

    const en = await withLanguage('en', () => useNumberFormat());
    expect(en.result.current(1.65, 2)).toBe('1.65');
  });

  it('counts pieces in the language of the reader', async () => {
    const sv = await withLanguage('sv', () => useQuantityFormat());
    expect(sv.result.current.pieces(3)).toBe('3 st');
    expect(sv.result.current.grams(250)).toBe('250 g');
    expect(sv.result.current.grams(1500)).toBe('1,5 kg');

    const en = await withLanguage('en', () => useQuantityFormat());
    expect(en.result.current.pieces(3)).toBe('3 pcs');
    expect(en.result.current.grams(1500)).toBe('1.5 kg');
  });
});

describe('household label', () => {
  it('names who the food is for, in Swedish', async () => {
    const { result } = await withLanguage('sv', () => useHouseholdLabel());
    expect(result.current(profile())).toBe('Du');
    expect(result.current(profile({ household: [ANNA] }))).toBe('Du + Anna');
    expect(result.current(profile({ household: [ANNA, KID] }))).toBe('Du + 2 andra');
  });

  it('names who the food is for, in English', async () => {
    const { result } = await withLanguage('en', () => useHouseholdLabel());
    expect(result.current(profile())).toBe('You');
    expect(result.current(profile({ household: [ANNA] }))).toBe('You + Anna');
    expect(result.current(profile({ household: [ANNA, KID] }))).toBe('You + 2 others');
  });

  it('copes with a person who has not been named yet', async () => {
    const unnamed = { id: 'x', name: '  ', portionFactor: 0.7 };
    const sv = await withLanguage('sv', () => useHouseholdLabel());
    expect(sv.result.current(profile({ household: [unnamed] }))).toBe('Du + en till');

    const en = await withLanguage('en', () => useHouseholdLabel());
    expect(en.result.current(profile({ household: [unnamed] }))).toBe('You + one more');
  });
});

describe('money', () => {
  it('suffixes the region currency and rounds to whole units', async () => {
    const sv = await withLanguage('sv', () => useCurrencyFormat());
    expect(sv.result.current(849.6)).toBe('850 kr');

    const en = await withLanguage('en', () => useCurrencyFormat());
    expect(en.result.current(849.6)).toBe('850 kr');
  });

  it('groups thousands the way the language does', async () => {
    const sv = await withLanguage('sv', () => useCurrencyFormat());
    // Swedish groups with a non-breaking space, English with a comma.
    expect(sv.result.current(1234)).toMatch(/^1[\s ]234 kr$/);

    const en = await withLanguage('en', () => useCurrencyFormat());
    expect(en.result.current(1234)).toBe('1,234 kr');
  });

  it('carries the currency on the list itself, not just in the view', () => {
    expect(buildShoppingList(generatePlan(profile(), { seed: 36 }), SWEDEN).currency).toBe('SEK');
  });
});

describe('shopping list export', () => {
  const list = () => buildShoppingList(generatePlan(profile(), { seed: 35 }), SWEDEN, 1.65);

  it('writes the header, departments and quantities in Swedish', async () => {
    const { result } = await withLanguage('sv', () => useShoppingFormat());
    const text = result.current.listText(list(), 'Du + Anna');

    expect(text).toContain('Inköpslista');
    expect(text).toContain('Du + Anna');
    expect(text).toContain('varor');
    expect(text).toContain('behöver');
  });

  it('writes the same list in English', async () => {
    const { result } = await withLanguage('en', () => useShoppingFormat());
    const text = result.current.listText(list(), 'You + Anna');

    expect(text).toContain('Shopping list');
    expect(text).toContain('You + Anna');
    expect(text).toContain('items');
    expect(text).toContain('need');
    expect(text).not.toContain('behöver');
  });

  it('caps a staple at one pack in both languages', async () => {
    const staple = list()
      .groups.flatMap((g) => g.items)
      .find((i) => i.ingredient.staple);
    if (!staple) throw new Error('fixture has no staple');

    const sv = await withLanguage('sv', () => useShoppingFormat());
    expect(sv.result.current.quantity(staple)).toContain('behöver ca');

    const en = await withLanguage('en', () => useShoppingFormat());
    expect(en.result.current.quantity(staple)).toContain('need approx');
  });
});
