# UAE Region + Language Cull Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the UAE as a third shopping region with Union Coop and Lulu Hypermarket, and cut the interface to Swedish + English with English primary.

**Architecture:** The region layer is already pluggable — `Region`, `assertRegion`, `registry.ts` and the region-scoped storage keys make no assumption about how many regions exist. The UAE is one registry entry plus its data. What is new is that the UAE is the first region whose own language is English, and dropping Croatian makes Croatia the second; the language work therefore lands first, because the subtitle and department-label consequences are shared.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, i18next / react-i18next, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-07-uae-region-design.md`

## Global Constraints

- Region ids are lowercase two-letter: `se`, `hr`, `ae`. `DEFAULT_REGION` stays `se`.
- Every UAE ingredient id is prefixed `ae-`; every UAE recipe id is prefixed `ae-`. Ids must be unique across *all* regions — `regions.test.ts` enforces it.
- Macros are per 100 g, or per 100 ml for liquids. Prices are per kg or per litre in the region's currency.
- Recipe quantities are per **one** serving. The planner scales from there.
- `steps` and `stepsLocal` must have the same length, and both must be non-empty.
- Every region needs a vegetarian, gluten-free, dairy-free and gluten+dairy-free option at **each** of the four meal slots (`breakfast`, `lunch`, `dinner`, `snack`).
- Interface languages after this work: `sv`, `en`. Nothing else. `DEFAULT_LANGUAGE` is `'en'`.
- Run tests with `npm test`. Run the type check with `npm run typecheck`. Both must pass before any commit.
- Commit messages: sentence-case imperative summary, no `feat:` / `fix:` prefixes. Match the existing log (`git log --oneline`).

---

## File Structure

**New:**

| File | Responsibility |
|---|---|
| `src/regions/ae/chains.ts` | `UNION_COOP`, `LULU`, `AE_CHAINS` — store identity and search URLs |
| `src/regions/ae/ingredients.ts` | `AE_INGREDIENTS` — the UAE catalogue |
| `src/regions/ae/recipes.ts` | `AE_RECIPES` — the UAE recipe pool |
| `src/regions/ae/index.ts` | The `UAE` region object, ending in `assertRegion(UAE)` |
| `src/regions/ae/chains.test.ts` | Search-URL shape, before the region is registered |
| `public/icons/unioncoop_icon.*`, `lulu_icon.*` | Chain marks |

**Deleted:** `src/i18n/locales/hr/` — all six namespace files.

**Modified:** `src/types.ts`, `src/regions/registry.ts`, `src/regions/hr/index.ts`, `src/data/ingredients.ts`, `src/i18n/index.ts`, `src/i18n/content.ts`, `src/i18n/hooks.ts`, `src/i18n/useShoppingFormat.ts`, `src/components/{RegionSwitcher,LanguageSwitcher,ChainMark,ShoppingView,WeekView,PrepView,RecipeModal}.tsx`, `src/i18n/locales/{sv,en}/{common,setup}.json`, and the test files named per task.

---

### Task 1: Pin the Swedish-chrome tests to Swedish

Several component tests call `i18n.changeLanguage(DEFAULT_LANGUAGE)` and then assert Swedish strings. They are testing Swedish chrome, which stays worth testing — they should just not be reading the default to get there. Decoupling them first means Task 2's flip is a two-line diff instead of a cascade of mystery failures.

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/components/SetupPanel.test.tsx`
- Modify: `src/components/PrepView.test.tsx`
- Modify: `src/components/WeekView.test.tsx`
- Modify: `src/components/LanguageSwitcher.test.tsx`
- Modify: `src/components/RegionSwitcher.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Behaviour-neutral refactor of tests only.

- [ ] **Step 1: Confirm the suite is green before touching anything**

Run: `npm test`
Expected: PASS. Note the total count — you need it in Step 4.

- [ ] **Step 2: Replace the default-language import with an explicit Swedish one**

In each of the six files, the `beforeEach` currently reads:

```tsx
beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});
```

Change it to:

```tsx
beforeEach(async () => {
  localStorage.clear();
  // Pinned rather than defaulted: these assert Swedish chrome, and the app's
  // default language is English. What is under test here is the Swedish
  // bundle, not what a first-time visitor lands in — that has its own test in
  // i18n.test.tsx.
  await i18n.changeLanguage('sv');
});
```

Then remove `DEFAULT_LANGUAGE` from that file's import of `../i18n` (or `./i18n`), keeping any other named imports. In `LanguageSwitcher.test.tsx` the import line becomes:

```tsx
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';
```

In `RegionSwitcher.test.tsx` it becomes:

```tsx
import i18n from '../i18n';
```

Apply the same removal in the other four. If a file imports `DEFAULT_LANGUAGE` and uses it somewhere other than `beforeEach`, replace that use with the literal `'sv'` too.

- [ ] **Step 3: Add the comment that stops this regressing**

At the top of `src/components/LanguageSwitcher.test.tsx`, above the imports:

```tsx
/**
 * Every test here forces a language rather than relying on the default. The
 * default is English and the assertions are Swedish, and coupling the two
 * would mean a change of default silently rewrites what these tests claim.
 */
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS, with the same total count as Step 1. Nothing has changed behaviourally — `DEFAULT_LANGUAGE` is still `'sv'` at this point, so forcing `'sv'` is identical.

- [ ] **Step 5: Commit**

```bash
git add src/App.test.tsx src/components/SetupPanel.test.tsx src/components/PrepView.test.tsx src/components/WeekView.test.tsx src/components/LanguageSwitcher.test.tsx src/components/RegionSwitcher.test.tsx
git commit -m "Force Swedish in the tests that assert Swedish"
```

---

### Task 2: Make English the primary language

**Files:**
- Modify: `src/i18n/index.ts`
- Test: `src/i18n/i18n.test.tsx`

**Interfaces:**
- Consumes: Task 1's pinned tests.
- Produces: `DEFAULT_LANGUAGE === 'en'`. Task 3 relies on this being the fallback a stale stored language lands on.

- [ ] **Step 1: Write the failing test**

Add to `src/i18n/i18n.test.tsx`, inside the top-level `describe` that already holds the bundle checks (the one containing `'translates the chrome rather than leaving English in place'`):

```tsx
it('lands a first-time visitor in English, whatever their country', async () => {
  // The default country is Sweden and the default language is English, and
  // that mismatch is deliberate: the plan you land on should be readable
  // before you have chosen anything.
  expect(DEFAULT_LANGUAGE).toBe('en');

  localStorage.clear();
  await act(async () => {
    await i18n.changeLanguage(undefined);
  });
  expect(i18n.resolvedLanguage).toBe('en');
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run src/i18n/i18n.test.tsx -t "lands a first-time visitor"`
Expected: FAIL — `expected 'sv' to be 'en'`.

- [ ] **Step 3: Flip the default**

In `src/i18n/index.ts`, replace:

```ts
export const DEFAULT_LANGUAGE: Language = 'sv';
```

with:

```ts
export const DEFAULT_LANGUAGE: Language = 'en';
```

Then rewrite the doc comment above `LANGUAGES`, which currently claims Swedish is the default because Sweden is the default region. That reasoning no longer holds and must not be left standing:

```ts
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
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS. Task 1 pinned every Swedish assertion, so nothing else moves.

- [ ] **Step 5: Type check and commit**

```bash
npm run typecheck
git add src/i18n/index.ts src/i18n/i18n.test.tsx
git commit -m "Land new readers in English, whatever country they shop in"
```

---

### Task 3: Remove the Croatian interface

Croatia stays a region. Only its interface language goes.

**Files:**
- Delete: `src/i18n/locales/hr/` (all six files)
- Modify: `src/i18n/index.ts`
- Modify: `src/i18n/locales/sv/common.json`, `src/i18n/locales/en/common.json`
- Modify: `src/components/LanguageSwitcher.tsx`
- Modify: `src/regions/hr/index.ts`
- Test: `src/i18n/i18n.test.tsx`, `src/components/LanguageSwitcher.test.tsx`

**Interfaces:**
- Consumes: `DEFAULT_LANGUAGE === 'en'` from Task 2.
- Produces: `LANGUAGES === ['sv', 'en'] as const`, so `Language` is `'sv' | 'en'`. `CROATIA.language === 'en'`. Task 5 depends on Croatia rendering through the English branch of the content accessors.

- [ ] **Step 1: Write the failing tests**

Add to `src/i18n/i18n.test.tsx`, in the same describe as Task 2's test:

```tsx
it('ships Swedish and English and nothing else', () => {
  expect([...LANGUAGES]).toEqual(['sv', 'en']);
});

it('sends a reader with Croatian stored back to English, not to Swedish', async () => {
  // Croatian was an interface language until it was dropped for being bad. A
  // stored choice of it is no longer supported, so i18next falls through to
  // fallbackLng. This asserts where that lands, because "works by accident"
  // stops working the day someone edits fallbackLng.
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'hr');
  await act(async () => {
    await i18n.changeLanguage('hr');
  });
  expect(i18n.resolvedLanguage).toBe('en');
});
```

Add `LANGUAGE_STORAGE_KEY` to the existing `./index` import at the top of that file:

```tsx
import i18n, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  resources,
  type Language,
} from './index';
```

And add to `src/components/LanguageSwitcher.test.tsx`:

```tsx
it('offers English alone in a region that has no language of its own', async () => {
  const user = userEvent.setup();
  await i18n.changeLanguage('en');
  render(
    <RegionProvider regionId="hr">
      <LanguageSwitcher />
    </RegionProvider>,
  );
  await user.click(screen.getByRole('button', { name: /language/i }));

  // Croatia's data is still Croatian; its interface is not. `languagesFor`
  // collapses to a single option, and the control has to survive that.
  expect(screen.getAllByRole('option')).toHaveLength(1);
  expect(screen.getByRole('option', { name: 'English' }).getAttribute('aria-selected')).toBe('true');
});
```

`RegionProvider` is exported from `src/regions/context.tsx` and takes `regionId: RegionId` plus an optional `chainId`. Import it with `import { RegionProvider } from '../regions/context';`.

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/i18n/i18n.test.tsx src/components/LanguageSwitcher.test.tsx`
Expected: FAIL — `LANGUAGES` still contains `'hr'`, and `resolvedLanguage` is `'hr'`.

- [ ] **Step 3: Delete the Croatian bundle**

```bash
git rm -r src/i18n/locales/hr
```

- [ ] **Step 4: Cut Croatian out of the i18n module**

In `src/i18n/index.ts`, delete these six import lines:

```ts
import hrCommon from './locales/hr/common.json';
import hrSetup from './locales/hr/setup.json';
import hrWeek from './locales/hr/week.json';
import hrShopping from './locales/hr/shopping.json';
import hrPrep from './locales/hr/prep.json';
import hrRecipe from './locales/hr/recipe.json';
```

Change:

```ts
export const LANGUAGES = ['sv', 'en', 'hr'] as const;
```

to:

```ts
export const LANGUAGES = ['sv', 'en'] as const;
```

And delete the whole `hr:` block from `resources`:

```ts
  hr: {
    common: hrCommon,
    setup: hrSetup,
    week: hrWeek,
    shopping: hrShopping,
    prep: hrPrep,
    recipe: hrRecipe,
  },
```

- [ ] **Step 5: Drop the Croatian language label**

In both `src/i18n/locales/sv/common.json` and `src/i18n/locales/en/common.json`, remove the `"hr"` line from the `language` block and fix the trailing comma so the JSON stays valid:

```json
  "language": {
    "label": "Language",
    "sv": "Svenska",
    "en": "English"
  },
```

Leave `region.hr` in `setup.json` alone in both files. Croatia is still a country you can shop in — only the interface translation is going.

- [ ] **Step 6: Drop it from the switcher and the plural map**

In `src/components/LanguageSwitcher.tsx`:

```ts
/** Spelled out rather than built as `language.${lang}` so the keys stay typed. */
const LABEL_KEY = { sv: 'language.sv', en: 'language.en' } as const;
```

In `src/i18n/i18n.test.tsx`, the plural-forms map is typed `Record<Language, string[]>`, so the compiler will point at the stale entry. Remove it:

```tsx
    const required: Record<Language, string[]> = {
      sv: ['one', 'other'],
      en: ['one', 'other'],
    };
```

- [ ] **Step 7: Move Croatia onto the English interface**

In `src/regions/hr/index.ts`, change `language: 'hr'` to `language: 'en'`, and amend the `deptLabels` comment so the field's status is on the record:

```ts
  language: 'en',
  // Croatian shops run much the same way round as Swedish ones: produce inside
  // the door, the counters along the back wall, dry goods and freezers on the
  // way to the tills.
  deptOrder: ['produce', 'meat', 'fish', 'dairy', 'bread', 'frozen', 'pantry'],
  // Kept, and no longer rendered. `deptLabel` reaches for these only when the
  // interface is in a language other than English, and Croatia's no longer is.
  // They stay because `assertRegion` and the region tests require every
  // department to be named, and because the day this region gets a translation
  // worth shipping they are what it starts from. The shopping list currently
  // shows the English labels; the *product* names underneath are still
  // Croatian, which is the part you shop off.
  deptLabels: {
```

- [ ] **Step 8: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Type check and commit**

```bash
npm run typecheck
git add -A src/i18n src/components/LanguageSwitcher.tsx src/regions/hr/index.ts
git commit -m "Drop the Croatian interface, keep the Croatian shelves"
```

---

### Task 4: Stop the country switch dragging you between languages

**Files:**
- Modify: `src/components/RegionSwitcher.tsx`
- Test: `src/components/RegionSwitcher.test.tsx`

**Interfaces:**
- Consumes: `languagesFor` from `../i18n`, `useLanguage` from `../i18n/hooks` (already imported for `setLanguage`).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing test**

In `src/components/RegionSwitcher.test.tsx`, replace the existing test named `'switches region, clears the chain and takes the language with it'` with these two. Note the queries are Swedish because Task 1 pinned this file to `'sv'`.

```tsx
it('switches region and clears the chain', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<RegionSwitcher profile={{ ...DEFAULT_PROFILE, chain: 'ica' }} onChange={onChange} />);
  await open(user);
  await user.click(screen.getByRole('option', { name: 'Kroatien' }));

  // The chain goes with the region: chain ids are scoped to one country, and
  // ICA means nothing in Croatia.
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ region: 'hr', chain: null }));
});

it('returns you to English when the new country cannot offer what you were reading', async () => {
  const user = userEvent.setup();
  render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
  await open(user);
  await user.click(screen.getByRole('option', { name: 'Kroatien' }));

  // Croatia has no Swedish interface, so Swedish cannot survive the move.
  // English can, and is where every region falls back to.
  expect(i18n.resolvedLanguage).toBe('en');
});

it('leaves a language the new country does still offer alone', async () => {
  const user = userEvent.setup();
  await i18n.changeLanguage('en');
  render(
    <RegionSwitcher profile={{ ...DEFAULT_PROFILE, region: 'hr' }} onChange={() => {}} />,
  );
  await user.click(screen.getByRole('button', { name: /var du handlar|where you shop/i }));
  await user.click(screen.getByRole('option', { name: /Sverige|Sweden/ }));

  // Sweden offers Swedish, but the reader did not ask for Swedish. Changing
  // country is not a request to change language.
  expect(i18n.resolvedLanguage).toBe('en');
});
```

- [ ] **Step 2: Run them to make sure the third fails**

Run: `npx vitest run src/components/RegionSwitcher.test.tsx`
Expected: FAIL on `'leaves a language the new country does still offer alone'` — `expected 'sv' to be 'en'`, because `choose` currently forces the region's own language.

- [ ] **Step 3: Change the rule**

In `src/components/RegionSwitcher.tsx`, pull the current language out of the hook:

```tsx
  const { language, setLanguage } = useLanguage();
```

and add the import:

```tsx
import { languagesFor } from '../i18n';
```

Then replace `choose`:

```tsx
  const choose = (id: RegionId) => {
    setOpen(false);
    if (id === profile.region) return;
    // The chain is cleared rather than carried over: chain ids are scoped to a
    // region, and Konzum means nothing in Sweden.
    onChange({ ...profile, region: id, chain: null });

    // Changing country is not a request to change language. Keep what the
    // reader is reading wherever the new region can serve it, and fall back to
    // English where it cannot — English is offered by every region, so this is
    // the only move that can ever happen, and only to someone who had
    // deliberately chosen Swedish.
    const next = regionOf(id);
    if (!languagesFor(next.language).includes(language)) setLanguage('en');
  };
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Type check and commit**

```bash
npm run typecheck
git add src/components/RegionSwitcher.tsx src/components/RegionSwitcher.test.tsx
git commit -m "Keep the language you are reading when you change country"
```

---

### Task 5: Collapse the subtitle where both names are the same

Nothing renders a matching pair yet — the UAE arrives in Task 9. This lands first so that when the region does arrive, it arrives into a UI that can already show it.

**Files:**
- Modify: `src/i18n/content.ts`
- Modify: `src/i18n/useShoppingFormat.ts:58`
- Modify: `src/components/ShoppingView.tsx:167-173`
- Modify: `src/components/WeekView.tsx:248-250`
- Modify: `src/components/PrepView.tsx:192-194`, `:254-256`
- Modify: `src/components/RecipeModal.tsx:80-82`, `:138-140`
- Test: `src/i18n/i18n.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `ingredientSubtitle(ing, lang)` and `recipeSubtitle(recipe, lang)` return `''` when the two names match, and their existing value otherwise. Task 9's catalogue relies on this to avoid rendering every UAE item twice.

- [ ] **Step 1: Write the failing tests**

Add to the `'content accessors'` describe in `src/i18n/i18n.test.tsx`:

```tsx
it('has no subtitle to give when both names are the same word', () => {
  // A region whose own language is English carries the same string in `name`
  // and `en`. There is no second name to show, and rendering the first one
  // twice reads as a bug.
  const ing = { ...getIngredient('lax'), name: 'Salmon fillet', en: 'Salmon fillet' };
  expect(ingredientSubtitle(ing, 'en')).toBe('');
  expect(ingredientSubtitle(ing, 'sv')).toBe('');

  const recipe = { ...RECIPES[0], name: 'Shish tawook', en: 'Shish tawook' };
  expect(recipeSubtitle(recipe, 'en')).toBe('');
  expect(recipeSubtitle(recipe, 'sv')).toBe('');
});

it('still gives the other name where the two differ', () => {
  // This half matters more than the half above: it is what proves Sweden and
  // Croatia were not quietly stripped of their shelf names.
  const lax = getIngredient('lax');
  expect(ingredientSubtitle(lax, 'en')).toBe('Laxfilé');
  expect(ingredientSubtitle(lax, 'sv')).toBe('Salmon fillet');
});
```

Add `ingredientSubtitle` to that file's existing import from `./content`.

And add, to the `describe` that exercises `useShoppingFormat` (find it by searching for `listText`):

```tsx
it('writes no empty brackets for an item with only one name', async () => {
  const { result } = await withLanguage('en', () => useShoppingFormat());
  const list = buildShoppingList(generatePlan(profile()), profile());
  const single = { ...list.groups[0].items[0] };
  single.ingredient = { ...single.ingredient, name: 'Salmon fillet', en: 'Salmon fillet' };
  const text = result.current.listText(
    { ...list, groups: [{ dept: list.groups[0].dept, items: [single] }] },
    'You',
  );

  expect(text).toContain('- Salmon fillet — ');
  expect(text).not.toContain('()');
});

it('keeps the other name in brackets where there is one', async () => {
  const { result } = await withLanguage('en', () => useShoppingFormat());
  const list = buildShoppingList(generatePlan(profile()), profile());
  const text = result.current.listText(list, 'You');
  // Swedish rows still carry their Swedish shelf name for an English reader.
  expect(text).toMatch(/- .+ \(.+\) — /);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/i18n/i18n.test.tsx`
Expected: FAIL — `expected 'Salmon fillet' to be ''`, and the export contains `()`.

- [ ] **Step 3: Collapse the accessors**

In `src/i18n/content.ts`, replace both subtitle functions:

```ts
/**
 * The name in the *other* language, shown as a subtitle beneath the title, or
 * an empty string where there is no other language to show.
 *
 * Kept visible in both directions on purpose: an English reader still has to
 * find "Kycklingfilé" on the shelf at ICA, and a local-language reader benefits
 * from the English name when checking a macro table.
 *
 * A region whose own language is English carries the same string in both
 * fields. That is honest data rather than a mistake — there really is only one
 * name — so this returns nothing and every caller drops the line instead of
 * printing the title twice.
 */
export function ingredientSubtitle(ingredient: Ingredient, lang: Language): string {
  if (ingredient.name === ingredient.en) return '';
  return lang === 'en' ? ingredient.name : ingredient.en;
}

/** The name in the *other* language, or '' where both names are the same. */
export function recipeSubtitle(recipe: Recipe, lang: Language): string {
  if (recipe.name === recipe.en) return '';
  return lang === 'en' ? recipe.name : recipe.en;
}
```

- [ ] **Step 4: Drop the empty brackets from the clipboard export**

In `src/i18n/useShoppingFormat.ts`, replace the loop body inside `listText`:

```ts
        for (const item of group.items) {
          const name = ingredientName(item.ingredient, language);
          const other = ingredientSubtitle(item.ingredient, language);
          // No brackets where there is no second name — "Salmon fillet ()" is
          // worse than no brackets at all.
          lines.push(`- ${name}${other ? ` (${other})` : ''} — ${quantity(item)}`);
        }
```

- [ ] **Step 5: Drop the empty subtitle line in all six render sites**

`src/components/ShoppingView.tsx` — this one also carries a separator, and an empty subtitle would leave a dangling `· 1 pack`:

```tsx
                      <label
                        htmlFor={boxId}
                        className="block cursor-pointer text-[11px] text-[var(--color-muted)]"
                      >
                        {ingredientSubtitle(item.ingredient, language) && (
                          <>
                            <span className="italic">
                              {ingredientSubtitle(item.ingredient, language)}
                            </span>
                            {' · '}
                          </>
                        )}
                        {quantity(item)}
                      </label>
```

`src/components/WeekView.tsx`:

```tsx
        <span className="block text-sm leading-snug font-bold">{recipeName(recipe, language)}</span>
        {recipeSubtitle(recipe, language) && (
          <span className="block text-[11px] leading-snug text-[var(--color-muted)] italic">
            {recipeSubtitle(recipe, language)}
          </span>
        )}
```

`src/components/PrepView.tsx`, the recipe header:

```tsx
            <h2 className="text-base leading-tight font-bold">{title}</h2>
            {recipeSubtitle(recipe, language) && (
              <p className="text-[11px] text-[var(--color-muted)] italic">
                {recipeSubtitle(recipe, language)}
              </p>
            )}
```

`src/components/PrepView.tsx`, the ingredient row:

```tsx
                  {ingredientSubtitle(ing, language) && (
                    <span className="block truncate text-[10px] text-[var(--color-muted)] italic">
                      {ingredientSubtitle(ing, language)}
                    </span>
                  )}
```

`src/components/RecipeModal.tsx`, the recipe header:

```tsx
            <h2 className="text-lg leading-tight font-bold">{title}</h2>
            {recipeSubtitle(recipe, language) && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)] italic">
                {recipeSubtitle(recipe, language)}
              </p>
            )}
```

`src/components/RecipeModal.tsx`, the ingredient row:

```tsx
                    {ingredientSubtitle(ing, language) && (
                      <span className="block text-[11px] text-[var(--color-muted)] italic">
                        {ingredientSubtitle(ing, language)}
                      </span>
                    )}
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Type check and commit**

```bash
npm run typecheck
git add src/i18n/content.ts src/i18n/useShoppingFormat.ts src/i18n/i18n.test.tsx src/components/ShoppingView.tsx src/components/WeekView.tsx src/components/PrepView.tsx src/components/RecipeModal.tsx
git commit -m "Say a name once when there is only one name to say"
```

---

### Task 6: Union Coop and Lulu

**Files:**
- Create: `src/regions/ae/chains.ts`
- Test: `src/regions/ae/chains.test.ts`

**Interfaces:**
- Consumes: `Chain` from `../index`.
- Produces: `UNION_COOP: Chain`, `LULU: Chain`, `AE_CHAINS: Chain[]` — consumed by Task 9's `src/regions/ae/index.ts`. Chain ids are `'unioncoop'` and `'lulu'`; Task 9 keys `ChainMark`'s `LOGOS` off exactly those strings.

- [ ] **Step 1: Write the failing test**

Create `src/regions/ae/chains.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { AE_CHAINS, LULU, UNION_COOP } from './chains';

/**
 * These assert the parameter names taken from each site, checked live. They
 * cannot prove the search works — only the site does that — but they stop the
 * shape being changed by accident, which is the failure that hurts here: both
 * sites answer 200 for a parameter they do not understand.
 */
describe('the UAE chains', () => {
  it('sends Union Coop q at its Magento search path', () => {
    const url = new URL(UNION_COOP.searchUrl!('chicken breast'));
    expect(url.hostname).toBe('www.unioncoop.ae');
    expect(url.pathname).toBe('/catalogsearch/result/');
    expect(url.searchParams.get('q')).toBe('chicken breast');
  });

  it('sends Lulu search_text, not q', () => {
    // Lulu's search is client-rendered and every guessable path 404s. This URL
    // is the one Lulu publishes in its own schema.org SearchAction, and `q`
    // does nothing there.
    const url = new URL(LULU.searchUrl!('salmon'));
    expect(url.hostname).toBe('gcc.luluhypermarket.com');
    expect(url.pathname).toBe('/en-ae/list/');
    expect(url.searchParams.get('search_text')).toBe('salmon');
    expect(url.searchParams.get('q')).toBeNull();
  });

  it('leads with the chain whose search can be verified', () => {
    // Union Coop renders results server-side, so its result count is countable
    // and the storeQuery overrides in ./ingredients.ts were checked against it.
    expect(AE_CHAINS[0].id).toBe('unioncoop');
    expect(AE_CHAINS.map((c) => c.id)).toEqual(['unioncoop', 'lulu']);
  });

  it('escapes a term that would otherwise break the URL', () => {
    for (const chain of AE_CHAINS) {
      const url = new URL(chain.searchUrl!('labneh & za’atar 100%'));
      expect(url.protocol, chain.id).toBe('https:');
      expect(url.href, chain.id).toContain(encodeURIComponent('labneh & za’atar 100%'));
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run src/regions/ae/chains.test.ts`
Expected: FAIL — cannot resolve `./chains`.

- [ ] **Step 3: Write the chains**

Create `src/regions/ae/chains.ts`:

```ts
import type { Chain } from '../index';

/**
 * The Dubai chains GainPlan supports, at chain level rather than per store:
 * prices are hand-estimated national figures, so naming a single branch would
 * imply a precision the data does not carry.
 *
 * Both search URLs were checked against the live sites by looking at what the
 * response contains, not at whether it returns 200 — the lesson from Konzum,
 * which rendered its whole search page for a parameter it did not understand
 * and looked like a working link for weeks.
 */

/**
 * Union Coop runs Magento Luma and renders search server-side, which makes it
 * the one chain here whose results can actually be counted.
 *
 * `?q=chicken` comes back carrying category refinement links — `&cat=2764`,
 * `&cat=2780`, a dozen more — and a link to page two. The control, `?q=zzqqxx`,
 * comes back with neither. That difference is the evidence; the 200 is not.
 */
export const UNION_COOP: Chain = {
  id: 'unioncoop',
  name: 'Union Coop',
  area: 'Dubai',
  onlineUrl: 'https://www.unioncoop.ae/',
  searchUrl: (term) =>
    `https://www.unioncoop.ae/catalogsearch/result/?q=${encodeURIComponent(term)}`,
};

/**
 * Lulu renders results client-side, so the product links cannot be counted from
 * the HTML, and every guessable search path — /search, /en-ae/search/,
 * /catalogsearch/result — returns 404 against a category path that returns 200.
 *
 * The working URL is the one Lulu publishes in its own schema.org SearchAction:
 * /en-ae/list/?search_text=. The server honours the term even though the markup
 * does not show it — "chicken" streams 610 KB, "salmon" 636 KB, and the
 * nonsense control "zzqqxxvv" only 470 KB, with the salmon payload carrying
 * real rows like "Fresh Norwegian Salmon Steak".
 */
export const LULU: Chain = {
  id: 'lulu',
  name: 'Lulu Hypermarket',
  area: 'Dubai',
  onlineUrl: 'https://gcc.luluhypermarket.com/en-ae',
  searchUrl: (term) =>
    `https://gcc.luluhypermarket.com/en-ae/list/?search_text=${encodeURIComponent(term)}`,
};

/**
 * Union Coop first: its search is server-rendered, which makes it the chain the
 * ingredient names and `storeQuery` overrides in ./ingredients.ts were checked
 * against, exactly as Konzum was for Croatia.
 */
export const AE_CHAINS: Chain[] = [UNION_COOP, LULU];
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/regions/ae/chains.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
npm run typecheck
git add src/regions/ae/chains.ts src/regions/ae/chains.test.ts
git commit -m "Add Union Coop and Lulu, with the evidence each search works"
```

---

### Task 7: The UAE catalogue

**Files:**
- Create: `src/regions/ae/ingredients.ts`
- Test: `src/regions/ae/ingredients.test.ts`

**Interfaces:**
- Consumes: `Ingredient`, `DeptId`, `DEPT_IDS` from `../../types`.
- Produces: `AE_INGREDIENTS: Ingredient[]`. Task 8's recipes may only reference ids from this array; Task 9 merges it into `INGREDIENTS` in `src/data/ingredients.ts`.

The catalogue is roughly 85 rows and cannot be inlined in a plan. The test below **is** the specification: write rows until it passes, using `src/regions/hr/ingredients.ts` as the template for formatting, ordering and comment style. One row per line, grouped by department with the same `// ── Name ───` banner comments.

- [ ] **Step 1: Write the failing test**

Create `src/regions/ae/ingredients.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEPT_IDS } from '../../types';
import { AE_INGREDIENTS } from './ingredients';

describe('the UAE catalogue', () => {
  it('carries enough of a shop to plan a week from', () => {
    expect(AE_INGREDIENTS.length).toBeGreaterThanOrEqual(80);
  });

  it('prefixes every id, so it cannot collide with another region', () => {
    for (const ing of AE_INGREDIENTS) expect(ing.id.startsWith('ae-'), ing.id).toBe(true);
  });

  it('gives no two rows the same id', () => {
    const ids = AE_INGREDIENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('stocks every department', () => {
    const stocked = new Set(AE_INGREDIENTS.map((i) => i.dept));
    for (const dept of DEPT_IDS) expect(stocked.has(dept), dept).toBe(true);
  });

  it('names each row once, because the region speaks English', () => {
    // This is what makes the subtitle collapse fire. A row where the two differ
    // would render a subtitle in a region that has no second language.
    for (const ing of AE_INGREDIENTS) {
      expect(ing.name, ing.id).toBe(ing.en);
      expect(ing.packName, ing.id).toBe(ing.packNameEn);
    }
  });

  it('gives every row a plausible price and pack', () => {
    for (const ing of AE_INGREDIENTS) {
      expect(ing.pricePerKg, ing.id).toBeGreaterThan(0);
      expect(ing.packSize, ing.id).toBeGreaterThan(0);
      expect(ing.name.trim(), ing.id).not.toBe('');
      expect(ing.packName.trim(), ing.id).not.toBe('');
    }
  });

  it('does not claim a food is made of nothing', () => {
    // A row with zero calories and zero macros is a typo, not a food.
    for (const ing of AE_INGREDIENTS) {
      const total = ing.protein + ing.carbs + ing.fat;
      expect(total, `${ing.id} has no macros at all`).toBeGreaterThan(0);
      expect(ing.kcal, ing.id).toBeGreaterThan(0);
    }
  });

  it('tags the things a restricted eater has to avoid', () => {
    const byId = new Map(AE_INGREDIENTS.map((i) => [i.id, i]));
    const mustHave: [string, string][] = [
      ['ae-chicken-breast', 'meat'],
      ['ae-salmon-fillet', 'fish'],
      ['ae-eggs', 'egg'],
    ];
    for (const [id, tag] of mustHave) {
      const ing = byId.get(id);
      expect(ing, `catalogue is missing ${id}`).toBeTruthy();
      expect(ing!.tags, id).toContain(tag);
    }
  });

  it('tags pork as pork, so the diet filter can drop it', () => {
    const pork = AE_INGREDIENTS.filter((i) => i.tags.includes('pork'));
    expect(pork.length, 'catalogue should carry pork rows').toBeGreaterThan(0);
    // Pork is meat before it is pork. A vegetarian filter keys off `meat`, and
    // a row tagged only `pork` would slip through it.
    for (const ing of pork) expect(ing.tags, ing.id).toContain('meat');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run src/regions/ae/ingredients.test.ts`
Expected: FAIL — cannot resolve `./ingredients`.

- [ ] **Step 3: Write the catalogue**

Create `src/regions/ae/ingredients.ts` with this header, then the rows:

```ts
import type { Ingredient } from '../../types';

/**
 * The Dubai catalogue. Macros are per 100 g (per 100 ml for liquids) and are
 * carried over from the Swedish and Croatian rows for the same product —
 * chicken breast is chicken breast, and retyping eighty-five nutrition panels
 * would only invent transcription errors.
 *
 * Prices are approximate AED/kg shelf prices and exist to give the plan a
 * realistic weekly cost. They are hand-estimated, exactly as the other regions'
 * are, and will drift. Treat the total as a planning figure and not a receipt.
 *
 * `name` and `en` hold the same string throughout, and so do `packName` and
 * `packNameEn`. This is the first region whose own language is English: there
 * is genuinely only one name, and `ingredientSubtitle` returns '' rather than
 * printing it twice.
 *
 * Ids carry an `ae-` prefix. The ingredient registry is shared across regions
 * rather than split per region, which is only sound while ids do not collide;
 * the prefix makes that true by construction. See src/regions/regions.test.ts.
 *
 * Pork sits in the meat section here as it does elsewhere, tagged `meat` and
 * `pork`. Note that UAE supermarkets sell it from a separate licensed room
 * rather than the main chiller — the shopping list cannot say so, but the
 * `pork` tag lets anyone who would rather not walk in there switch it off.
 */
export const AE_INGREDIENTS: Ingredient[] = [
  // ── Fruit & Veg ─────────────────────────────────────────────────────────
  { id: 'ae-banana', name: 'Banana', en: 'Banana', dept: 'produce', kcal: 89, protein: 1.1, carbs: 21, fat: 0.3, pricePerKg: 6.5, packSize: 1000, packName: 'loose', packNameEn: 'loose', unitWeight: 120, tags: [] },
  // ... continue, department by department
];
```

Rules for the rows:

- Cover the same ground as `src/regions/hr/ingredients.ts` — read it first and work through it department by department. Roughly: 20 produce, 8 meat, 4 fish, 14 dairy, 5 bread, 25 pantry, 5 frozen.
- Add what a Gulf shop has and a Croatian one does not, because Task 8's recipes need them: tahini, chickpeas (dried and tinned), fava beans, labneh, halloumi, dates, basmati rice, bulgur, freekeh, za'atar, sumac, baharat, harissa, pomegranate molasses, flatbread, pita, hummus, fresh mint and coriander, hammour or seabass.
- Prices in AED. Sanity anchors: chicken breast ~26, salmon fillet ~65, eggs ~14/kg, basmati rice ~9, tomatoes ~7, olive oil ~35, dates ~25.
- Set `unitWeight` on anything counted rather than weighed — eggs, bananas, pita, lemons.
- Set `staple: true` on spices, oils, vinegars, garlic, ginger and anything else one pack of lasts months.
- Set `storeQuery` only where the display name is more specific than what the store's search wants. Verify each one against Union Coop by fetching `https://www.unioncoop.ae/catalogsearch/result/?q=<term>` and checking the response carries `cat=` refinement links; a term that produces none found nothing. Do not add a `storeQuery` you have not checked.

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/regions/ae/ingredients.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
npm run typecheck
git add src/regions/ae/ingredients.ts src/regions/ae/ingredients.test.ts
git commit -m "Stock a Dubai shop"
```

---

### Task 8: The UAE recipe pool

**Files:**
- Create: `src/regions/ae/recipes.ts`
- Test: `src/regions/ae/recipes.test.ts`

**Interfaces:**
- Consumes: `AE_INGREDIENTS` ids from Task 7, `recipeTags` from `../../lib/nutrition`.
- Produces: `AE_RECIPES: Recipe[]`, consumed by Task 9's `src/regions/ae/index.ts`.

Same principle as Task 7: the test is the specification. Use `src/regions/hr/recipes.ts` as the template for shape and comment style.

- [ ] **Step 1: Write the failing test**

Create `src/regions/ae/recipes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { DietTag, MealSlot } from '../../types';
import { recipeTags } from '../../lib/nutrition';
import { AE_INGREDIENTS } from './ingredients';
import { AE_RECIPES } from './recipes';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

describe('the UAE recipe pool', () => {
  it('is deep enough to plan a week without repeating itself', () => {
    expect(AE_RECIPES.length).toBeGreaterThanOrEqual(30);
  });

  it('prefixes every id', () => {
    for (const r of AE_RECIPES) expect(r.id.startsWith('ae-'), r.id).toBe(true);
  });

  it('gives no two recipes the same id', () => {
    const ids = AE_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only asks for ingredients this region stocks', () => {
    const stocked = new Set(AE_INGREDIENTS.map((i) => i.id));
    for (const r of AE_RECIPES) {
      for (const ri of r.ingredients) {
        expect(stocked.has(ri.id), `${r.id} wants ${ri.id}`).toBe(true);
      }
    }
  });

  it('titles each recipe once, because the region speaks English', () => {
    for (const r of AE_RECIPES) expect(r.name, r.id).toBe(r.en);
  });

  it('writes a method, and the same one in both fields', () => {
    // The type demands two languages and there is only one. Same text in both
    // is the honest answer; a mismatched length would be a copy-paste slip.
    for (const r of AE_RECIPES) {
      expect(r.steps.length, r.id).toBeGreaterThan(0);
      expect(r.stepsLocal, r.id).toEqual(r.steps);
    }
  });

  it('fills every meal slot', () => {
    for (const slot of SLOTS) {
      const n = AE_RECIPES.filter((r) => r.slots.includes(slot)).length;
      expect(n, `nothing to eat at ${slot}`).toBeGreaterThanOrEqual(4);
    }
  });

  it('feeds a restricted eater at every meal', () => {
    // The same contract regions.test.ts applies to every region, asserted here
    // so it fails in this file rather than three tasks later.
    const combos: [string, DietTag[]][] = [
      ['vegetarian', ['meat', 'pork', 'fish']],
      ['gluten free', ['gluten']],
      ['dairy free', ['dairy', 'lactose']],
      ['gluten + dairy free', ['gluten', 'dairy', 'lactose']],
    ];
    for (const [label, exclude] of combos) {
      const excluded = new Set(exclude);
      const usable = AE_RECIPES.filter((r) => ![...recipeTags(r)].some((t) => excluded.has(t)));
      for (const slot of SLOTS) {
        const n = usable.filter((r) => r.slots.includes(slot)).length;
        expect(n, `${label} / ${slot}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps a base serving to the size of a meal', () => {
    // Quantities are per one serving and the planner scales from there. A base
    // portion that is already a double sends the optimiser off in the wrong
    // direction.
    for (const r of AE_RECIPES) {
      const grams = r.ingredients.reduce((sum, ri) => sum + ri.g, 0);
      expect(grams, `${r.id} is tiny`).toBeGreaterThan(100);
      expect(grams, `${r.id} is enormous`).toBeLessThan(1200);
    }
  });

  it('does not scale the seasoning with the portion', () => {
    // Nobody wants 1.8x the garlic because they are bulking. Every recipe that
    // uses an aromatic should pin it.
    const aromatics = new Set(
      AE_INGREDIENTS.filter((i) => i.staple).map((i) => i.id),
    );
    for (const r of AE_RECIPES) {
      for (const ri of r.ingredients) {
        if (aromatics.has(ri.id)) expect(ri.fixed, `${r.id} / ${ri.id}`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run src/regions/ae/recipes.test.ts`
Expected: FAIL — cannot resolve `./recipes`.

- [ ] **Step 3: Write the pool**

Create `src/regions/ae/recipes.ts` with this header, then roughly 35 recipes:

```ts
import type { Recipe } from '../../types';

/**
 * Emirati and wider Gulf recipes. All quantities are per ONE serving; the
 * planner multiplies them to hit your macro targets, so base amounts sit at a
 * normal portion — roughly 400-700 kcal for mains, 150-350 kcal for snacks.
 *
 * `fixed: true` marks aromatics and seasonings that should not grow with the
 * portion. Nobody wants 1.8x the baharat because they are bulking.
 *
 * These are dishes you can actually buy the parts for at Union Coop and Lulu,
 * rewritten around gram-accurate macros — not the Swedish pool with the names
 * changed. Where a classic does not survive the rewrite honestly it is left out
 * rather than faked.
 *
 * `name` and `en` hold the same string, and `stepsLocal` repeats `steps`. The
 * region's own language is English, so there is no second version to write and
 * inventing one would be worse than repeating it.
 */
export const AE_RECIPES: Recipe[] = [
  // ── Breakfast ────────────────────────────────────────────────────────────
  {
    id: 'ae-shakshuka',
    name: 'Shakshuka with feta',
    en: 'Shakshuka with feta',
    slots: ['breakfast', 'lunch'],
    minutes: 20,
    batchFriendly: false,
    ingredients: [
      { id: 'ae-eggs', g: 120 },
      { id: 'ae-tomato', g: 200 },
      { id: 'ae-bell-pepper', g: 80 },
      { id: 'ae-onion', g: 60 },
      { id: 'ae-feta', g: 30 },
      { id: 'ae-olive-oil', g: 10, fixed: true },
      { id: 'ae-cumin', g: 2, fixed: true },
    ],
    steps: [
      'Soften the onion and pepper in the oil over a medium heat, about six minutes.',
      'Add the chopped tomato and cumin and simmer until thick, about eight minutes.',
      'Make two wells, crack in the eggs, cover and cook until the whites set.',
      'Crumble the feta over the top.',
    ],
    stepsLocal: [
      'Soften the onion and pepper in the oil over a medium heat, about six minutes.',
      'Add the chopped tomato and cumin and simmer until thick, about eight minutes.',
      'Make two wells, crack in the eggs, cover and cook until the whites set.',
      'Crumble the feta over the top.',
    ],
  },
  // ... continue
];
```

Dishes to draw from — pick across them so the slot and diet coverage above falls out naturally rather than being patched at the end:

- **Breakfast:** shakshuka, foul medames, labneh with za'atar and flatbread, balaleet, chickpea and egg hash, date and tahini overnight oats, masala omelette, fruit and labneh bowl.
- **Lunch:** chicken shawarma bowl, fattoush with grilled halloumi, tabbouleh with chickpeas, lentil shorba, tuna and freekeh salad, falafel plate with hummus, machboos with chicken.
- **Dinner:** shish tawook, grilled hammour with rice, kabsa, beef kofta with tahini sauce, chicken biryani, prawn masala, harissa salmon with bulgur, mujadara, grilled seabass with salad.
- **Snack:** hummus with vegetables, labneh with cucumber, dates with almonds, roasted chickpeas, yoghurt with pomegranate, boiled eggs with sumac, tahini protein bites.

Set `fixed: true` on every ingredient the catalogue marks `staple` — spices, oils, garlic, ginger. The final test in Step 1 enforces it.

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/regions/ae/recipes.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
npm run typecheck
git add src/regions/ae/recipes.ts src/regions/ae/recipes.test.ts
git commit -m "Cook what a Dubai shop actually sells"
```

---

### Task 9: Wire the UAE in

Everything before this was inert. This is where the region becomes reachable, and where the parameterised checks in `regions.test.ts` start running against it.

**Files:**
- Create: `src/regions/ae/index.ts`
- Create: `public/icons/unioncoop_icon.*`, `public/icons/lulu_icon.*`
- Modify: `src/types.ts`
- Modify: `src/regions/registry.ts`
- Modify: `src/data/ingredients.ts:122-124`
- Modify: `src/i18n/hooks.ts`
- Modify: `src/components/RegionSwitcher.tsx`
- Modify: `src/components/ChainMark.tsx`
- Modify: `src/i18n/locales/sv/setup.json`, `src/i18n/locales/en/setup.json`
- Test: `src/regions/regions.test.ts`, `src/components/RegionSwitcher.test.tsx`

**Interfaces:**
- Consumes: `AE_CHAINS` (Task 6), `AE_INGREDIENTS` (Task 7), `AE_RECIPES` (Task 8).
- Produces: `UAE: Region` with `id: 'ae'`, `language: 'en'`, `currency: 'AED'`.

- [ ] **Step 1: Write the failing tests**

Add to `src/regions/regions.test.ts`, inside the existing `describe('chain search URLs keep the parameter each site expects')`:

```ts
  it('sends Union Coop q', () => {
    const url = new URL(chainNamed('unioncoop')!.searchUrl!('chicken'));
    expect(url.pathname).toBe('/catalogsearch/result/');
    expect(url.searchParams.get('q')).toBe('chicken');
  });

  it('sends Lulu search_text, not q', () => {
    // Lulu's own schema.org SearchAction is where this URL comes from; every
    // guessable alternative 404s. See ./ae/chains.ts.
    const url = new URL(chainNamed('lulu')!.searchUrl!('salmon'));
    expect(url.pathname).toBe('/en-ae/list/');
    expect(url.searchParams.get('search_text')).toBe('salmon');
    expect(url.searchParams.get('q')).toBeNull();
  });
```

And add to `describe('the registry')` in the same file:

```ts
  it('shops in three countries, in two currencies and two languages', () => {
    expect([...REGION_IDS]).toEqual(['se', 'hr', 'ae']);
    expect(regionOf('ae').currency).toBe('AED');
    expect(regionOf('ae').language).toBe('en');
    // Croatia keeps its shelves and loses its interface.
    expect(regionOf('hr').language).toBe('en');
  });
```

And add to `src/components/RegionSwitcher.test.tsx`:

```tsx
it('lists the UAE alongside the other two', async () => {
  const user = userEvent.setup();
  render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
  await open(user);
  expect(screen.getAllByRole('option')).toHaveLength(3);
  expect(screen.getByRole('option', { name: /Förenade Arabemiraten|United Arab Emirates/ })).toBeTruthy();
});
```

Update the existing `'lists every country, marking the active one'` test in that file from `toHaveLength(2)` to `toHaveLength(3)`.

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/regions/regions.test.ts src/components/RegionSwitcher.test.tsx`
Expected: FAIL — no chain named `unioncoop`, `REGION_IDS` has two entries.

- [ ] **Step 3: Add the id and the currency**

In `src/types.ts`:

```ts
export const REGION_IDS = ['se', 'hr', 'ae'] as const;
export type RegionId = (typeof REGION_IDS)[number];

export type Currency = 'SEK' | 'EUR' | 'AED';
```

In `src/i18n/hooks.ts`, extend the symbol map. The comment above it says every currency here suffixes — still true, so it needs no rewrite:

```ts
const CURRENCY_SYMBOL: Record<Currency, string> = { SEK: 'kr', EUR: '€', AED: 'AED' };
```

- [ ] **Step 4: Assemble the region**

Create `src/regions/ae/index.ts`:

```ts
import type { Region } from '../index';
import { assertRegion } from '../index';
import { AE_CHAINS } from './chains';
import { AE_INGREDIENTS } from './ingredients';
import { AE_RECIPES } from './recipes';

export const UAE: Region = {
  id: 'ae',
  // The first region whose own language is English. `languagesFor` collapses to
  // a single option here, and the content accessors return no subtitle, because
  // there is no second name to show.
  language: 'en',
  currency: 'AED',
  // A Gulf hypermarket puts the bakery inside the door, next to the fruit, and
  // runs the fresh counters along the back wall. Freezers come before the dry
  // aisles on the way to the tills.
  deptOrder: ['produce', 'bread', 'meat', 'fish', 'dairy', 'frozen', 'pantry'],
  // Required by assertRegion and never rendered: `deptLabel` reaches for these
  // only when the interface is in a language other than English, and this
  // region has no other language. They hold the English labels so that if that
  // ever changes, nothing reads as missing.
  deptLabels: {
    produce: 'Fruit & Veg',
    meat: 'Meat & Deli',
    fish: 'Fish',
    dairy: 'Dairy & Eggs',
    bread: 'Bread',
    pantry: 'Pantry',
    frozen: 'Frozen',
  },
  chains: AE_CHAINS,
  ingredients: AE_INGREDIENTS,
  recipes: AE_RECIPES,
};

assertRegion(UAE);
```

- [ ] **Step 5: Register it, and put its ingredients in the shared lookup**

In `src/regions/registry.ts`:

```ts
import { UAE } from './ae';

export const REGIONS: Record<RegionId, Region> = { se: SWEDEN, hr: CROATIA, ae: UAE };
```

In `src/data/ingredients.ts`, add the import and extend the merge. `regions.test.ts` asserts `seen.size === Object.keys(INGREDIENTS).length`, so a region left out of this line fails there rather than here:

```ts
import { AE_INGREDIENTS } from '../regions/ae/ingredients';

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  [...INGREDIENT_LIST, ...HR_INGREDIENTS, ...AE_INGREDIENTS].map((i) => [i.id, i]),
);
```

Update that block's doc comment, which currently says ids are unique because Croatian rows carry an `hr-` prefix:

```ts
/**
 * Every ingredient the app knows, across all regions. One table rather than one
 * per region: ids are unique region-wide (Croatian rows carry an `hr-` prefix,
 * Emirati ones `ae-`), and a shared lookup keeps `getIngredient` out of the
 * business of knowing who is asking. Which subset a plan may draw from is the
 * region's job, not this table's — see `eligibleRecipes`.
 */
```

- [ ] **Step 6: Name the country in both languages**

In `src/i18n/locales/en/setup.json`:

```json
  "region": {
    "title": "Where you shop",
    "hint": "Picks the food, recipes, stores, currency and language.",
    "se": "Sweden",
    "hr": "Croatia",
    "ae": "United Arab Emirates"
  },
```

Add the matching `"ae": "Förenade Arabemiraten"` to `src/i18n/locales/sv/setup.json`, keeping that file's existing Swedish values for the other keys.

- [ ] **Step 7: Give it a flag**

In `src/components/RegionSwitcher.tsx`, add beside the other two:

```tsx
function FlagAe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="10" fill="#00732f" />
      <rect y="3.34" width="16" height="3.33" fill="#fff" />
      <rect y="6.67" width="16" height="3.33" fill="#000" />
      <rect width="4" height="10" fill="#ff0000" />
    </svg>
  );
}
```

and extend both maps:

```tsx
const FLAGS: Record<RegionId, (props: { className?: string }) => React.ReactElement> = {
  se: FlagSe,
  hr: FlagHr,
  ae: FlagAe,
};

/** Spelled out rather than built as `region.${id}` so the keys stay typed. */
const LABEL_KEY = { se: 'region.se', hr: 'region.hr', ae: 'region.ae' } as const;
```

- [ ] **Step 8: Add the chain marks**

Fetch each chain's own logo — the favicon or the header mark from its site — and save them as `public/icons/unioncoop_icon.png` and `public/icons/lulu_icon.png`, matching the existing files' small square shape. Then in `src/components/ChainMark.tsx`:

```tsx
const LOGOS: Record<string, string> = {
  ica: '/icons/ica_icon.webp',
  konzum: '/icons/konzum_icon.png',
  kaufland: '/icons/kaufland_icon.webp',
  unioncoop: '/icons/unioncoop_icon.png',
  lulu: '/icons/lulu_icon.png',
};
```

If a usable mark cannot be obtained for one of them, leave that chain out of `LOGOS` entirely rather than shipping a redrawn approximation. The component already falls back to the chain's initial on the app's own chrome, and the file comment says so — that fallback exists for exactly this.

- [ ] **Step 9: Run everything**

Run: `npm test`
Expected: PASS. The parameterised suites in `regions.test.ts` now cover the UAE for free — department completeness, ingredient stocking, cross-region id uniqueness, restricted-eater coverage at every slot, and https on every chain URL.

- [ ] **Step 10: Type check, build, and commit**

```bash
npm run typecheck
npm run build
git add src/types.ts src/regions src/data/ingredients.ts src/i18n src/components public/icons
git commit -m "Add the UAE as a third region"
```

---

### Task 10: Check it in a browser

The suite proves the data holds together. It does not prove the UAE reads well, and this is the first region rendering without subtitles.

**Files:** none — verification only.

- [ ] **Step 1: Start the app**

Run: `npm run dev`

- [ ] **Step 2: Walk the UAE**

Switch the country control to the United Arab Emirates and confirm, in order:

- the language control collapses to English alone and does not look broken doing it
- the week fills with Gulf dishes, no Swedish or Croatian titles among them
- recipe cards show a title and **no** empty second line under it
- the shopping list shows department headers, item names with no duplicated subtitle, and no stray `·` before the quantity
- the total reads as `1,234 AED`
- an item name links out to Union Coop and lands on a result list with products on it
- switching the chain to Lulu changes the links, and one of those lands on results too
- copying the list to the clipboard produces `- Chicken breast — pack approx 900 g` with no empty brackets

- [ ] **Step 3: Confirm the other two regions did not regress**

Switch to Croatia: department headers are now English, product names are still Croatian, and each ingredient still shows its Croatian name as a subtitle. Switch to Sweden: everything is as it was, and the language control offers Swedish and English both.

- [ ] **Step 4: Commit anything the walk-through turned up**

If nothing did, there is nothing to commit. Say so rather than inventing a change.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Union Coop / Lulu search URLs | 6 |
| English-region subtitle collapse | 5 |
| Clipboard export brackets | 5 |
| `LANGUAGES` to `['sv','en']`, `DEFAULT_LANGUAGE` to `'en'` | 2, 3 |
| Delete `locales/hr`, `language.hr`, `LABEL_KEY` | 3 |
| Croatia's `language: 'en'`, dead `deptLabels` documented | 3, 9 |
| Stored `hr` falls back to English | 3 |
| Region switch preserves language | 4 |
| `'ae'` in `REGION_IDS`, `'AED'` in `Currency` + symbol | 9 |
| Catalogue, ~85 rows, `ae-` prefixed, pork tagged | 7 |
| Recipe pool, ~35, Gulf dishes, slot + diet coverage | 8 |
| Flag, labels, chain marks, registry, shared `INGREDIENTS` | 9 |
| `regions.test.ts` search-parameter assertions | 9 |

**Two things this plan adds that the spec did not name**, both found by reading the code rather than the spec:

1. **Task 1 exists because of a landmine.** Six test files call `changeLanguage(DEFAULT_LANGUAGE)` and then assert Swedish. Flipping the default in Task 2 would have broken all of them at once, in a way that looks like the flip was wrong rather than the tests being coupled.
2. **`ShoppingView.tsx` renders `{subtitle}{' · '}{quantity}`.** An empty subtitle leaves a dangling separator. Same class of defect as the clipboard brackets the spec did catch, in a file it did not name.

**Placeholder scan:** no TBDs. Tasks 7 and 8 are the one place this plan does not inline the deliverable — 85 catalogue rows and 35 recipes cannot go in a plan document. They are specified by a complete, runnable test file plus an explicit list of what to cover, which is the strongest form the instruction can take here. That is stated rather than hidden.

**Type consistency:** chain ids `'unioncoop'` / `'lulu'` are used identically in `chains.ts`, `ChainMark`'s `LOGOS`, and both test files. `AE_CHAINS` / `AE_INGREDIENTS` / `AE_RECIPES` are named consistently across Tasks 6-9 and match the `HR_*` convention. `UAE` matches `SWEDEN` / `CROATIA`.
