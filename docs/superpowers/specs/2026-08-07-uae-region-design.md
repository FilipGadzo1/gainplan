# Adding the UAE, and cutting the interface back to two languages

**Date:** 2026-08-07
**Status:** approved, ready for planning

GainPlan currently shops in Sweden and Croatia, in three interface languages.
This does two things at once, because they meet in the same place:

- adds the UAE — Dubai — with Union Coop and Lulu Hypermarket as its chains
- drops the Croatian interface translation, leaving Swedish and English, and
  makes English the primary language

They belong in one change because the UAE is the first region whose own
language is English, and the language cull makes Croatia the second. Whatever
handles one has to handle both.

## Why this is mostly data

The region layer already carries its own weight. `Region`, `assertRegion`, the
registry and the region-scoped storage keys were built when Croatia went in,
and none of them assume two regions. Adding a third is one import and one entry
in `registry.ts` plus the data behind it.

What is genuinely new is everything that follows from a region whose own
language is English.

## Decisions

### The store search URLs

Both were checked against the live sites by looking at what the response
contains, not at whether it returns 200 — the lesson from Konzum, which renders
its whole search page for a parameter it does not understand.

**Union Coop** runs Magento Luma and renders search server-side.

    https://www.unioncoop.ae/catalogsearch/result/?q=<term>

`?q=chicken` comes back with category refinement links (`&cat=2764`,
`&cat=2780`, and a dozen more) and a link to page 2. The control, `?q=zzqqxx`,
comes back with neither. That is a working product search.

**Lulu** runs Next.js and renders results client-side, so the product links
cannot be counted from the HTML. Every guessable search path — `/search`,
`/en-ae/search/`, `/catalogsearch/result` — returns 404 against a valid-path
control that returns 200. The real URL is published in Lulu's own schema.org
`SearchAction`:

    https://gcc.luluhypermarket.com/en-ae/list/?search_text=<term>

The server honours the term even though the markup does not show it: `chicken`
streams 610 KB, `salmon` 636 KB, and the nonsense control `zzqqxxvv` only
470 KB. The salmon payload contains real rows — "Fresh Norwegian Salmon Steak",
"Estro Atlantic Smkd Salmon 80g". Prices come back in `aed`.

Union Coop is listed first. Its search is server-rendered, which makes it the
chain the `storeQuery` overrides can actually be verified against, exactly as
Konzum was for Croatia.

Neither chain publishes an add-to-basket URL. Search results are as far as the
link can take you, which is true of every chain the app supports.

### English as a region's own language

Every data row carries a local name and an English name, and the content
accessors render one as a subtitle under the other. For the UAE they are the
same string, so an item would read "Salmon fillet / Salmon fillet".

Croatia does not have this problem even after the language cull: its rows still
carry `Pileća prsa` alongside `Chicken breast`, so an English reader keeps the
shelf name as a subtitle. That is the whole reason the subtitle exists, and it
survives.

`ingredientSubtitle` and `recipeSubtitle` return `''` when the two names match,
and the render sites skip the element on an empty string rather than leaving a
blank line. The data stays honest — `name` and `en` really are the same here —
and no other region changes behaviour.

`packName` / `packNameEn` collapse the same way but are never shown as a pair,
so `packName` needs no change.

`languagesFor` already returns `['en']` alone for an English region, so the
language switcher collapses to a single option without being touched.

`deptLabels` is only read when the language is *not* English, which for the UAE
and — after the cull — for Croatia is never. Only Sweden still renders it. It
stays required by `assertRegion` and by the "names every department it walks"
test, so the UAE holds the English labels and Croatia keeps its Croatian ones,
both with a comment saying the field is only reached in a region that offers a
non-English interface.

The visible consequence, accepted deliberately: a Croatian shopping list now
reads "FRUIT & VEG" rather than "VOĆE I POVRĆE". The product names underneath
are still Croatian, which is the part you shop off.

### Dropping the Croatian interface

`LANGUAGES` becomes `['sv', 'en']` and `DEFAULT_LANGUAGE` becomes `'en'`.
`DEFAULT_REGION` stays `se` — the default country and the default language are
now deliberately different, and the comment in `i18n/index.ts` that currently
explains why Swedish is the default has to be rewritten rather than left
standing.

Croatia's `Region.language` becomes `'en'`. Nothing else about the region
changes: its chains, catalogue and recipes are untouched.

Removing a language is mostly deletion, and the existing tests do most of the
work — `i18n.test.tsx` is parameterised over `LANGUAGES`, so the key-parity,
plural-form and empty-value checks follow automatically. The one explicit
mention is the `required` map of plural categories, typed
`Record<Language, string[]>`, so the compiler flags the stale `hr` entry.

- delete `src/i18n/locales/hr/`, its six imports and its `resources` entry
- drop `language.hr` from the `sv` and `en` `common.json`. `region.hr` stays —
  Croatia is still a country you can shop in
- drop `hr` from `LABEL_KEY` in `LanguageSwitcher.tsx`
- drop the `hr` entry from the plural-forms map in `i18n.test.tsx`

A stored `gainplan.lang.v1` of `hr` from a previous visit is no longer in
`supportedLngs`, so i18next resolves it to `fallbackLng`, which is now English.
That is the right landing place and needs no migration code, but it does need a
test — silent fallback is exactly the kind of thing that works until someone
changes `fallbackLng`.

### Switching country no longer changes your language

`RegionSwitcher` currently calls `setLanguage(regionOf(id).language)`, forcing
the UI into the new region's language. With English primary that is wrong: it
would drag an English reader into Swedish for choosing Sweden.

It becomes: keep the current language if the new region offers it, otherwise
fall back to English. Since Croatia and the UAE offer English alone, and
English is offered everywhere, the only movement left is a reader who
deliberately chose Swedish being returned to English when they leave Sweden.

`RegionSwitcher.test.tsx:55` asserts the old behaviour and is rewritten rather
than deleted — it becomes the test for the new rule.

### Pork

The catalogue includes pork rows, tagged `pork` so the diet filter can drop
them, with a comment noting that UAE supermarkets sell these from a separate
licensed section rather than the main chiller.

## What changes

### New files

- `src/regions/ae/chains.ts` — `UNION_COOP`, `LULU`, `AE_CHAINS`
- `src/regions/ae/ingredients.ts` — `AE_INGREDIENTS`, roughly 85 rows
- `src/regions/ae/recipes.ts` — `AE_RECIPES`, roughly 35 recipes
- `src/regions/ae/index.ts` — the `UAE` region, ending in `assertRegion(UAE)`
- `public/icons/` — one logo file per chain

### Edited files

- `src/types.ts` — `'ae'` in `REGION_IDS`, `'AED'` in `Currency`
- `src/regions/registry.ts` — one import, one entry. `DEFAULT_REGION` stays `se`
- `src/i18n/hooks.ts` — `AED` in `CURRENCY_SYMBOL`, suffixed like `kr` and `€`
- `src/i18n/content.ts` — the two subtitle accessors return `''` on a match
- `src/components/PrepView.tsx` (recipe + ingredient), `RecipeModal.tsx`
  (recipe + ingredient), `ShoppingView.tsx` (ingredient), `WeekView.tsx`
  (recipe) — skip the subtitle element when it is empty. Six render sites
- `src/i18n/useShoppingFormat.ts` — the clipboard export writes
  `` `- ${name} (${other}) — …` ``, which becomes `- Salmon fillet () — …` on an
  empty subtitle. The parenthesised part is omitted when there is no subtitle
- `src/components/RegionSwitcher.tsx` — a UAE flag SVG, a `LABEL_KEY` entry,
  and the new language-preserving switch rule
- `src/components/ChainMark.tsx` — two entries in `LOGOS`
- `src/i18n/index.ts` — `LANGUAGES` to `['sv', 'en']`, `DEFAULT_LANGUAGE` to
  `'en'`, the `hr` imports and `resources` entry removed, the "why Swedish is
  the default" comment rewritten
- `src/components/LanguageSwitcher.tsx` — `hr` out of `LABEL_KEY`
- `src/regions/hr/index.ts` — `language: 'en'`
- `src/i18n/locales/{sv,en}/setup.json` — a `region.ae` label in each
- `src/i18n/locales/{sv,en}/common.json` — `language.hr` removed
- `src/regions/regions.test.ts` — search-parameter assertions for both chains
- `src/i18n/i18n.test.tsx` — `hr` out of the plural-forms map
- `src/components/RegionSwitcher.test.tsx` — the language rule rewritten

### Deleted

- `src/i18n/locales/hr/` — all six namespace files

Storage needs no change: `regionKey` is generic and `REGION_IDS` drives the
cleanup path.

## The catalogue

Roughly 85 ingredients, ids prefixed `ae-`, covering all seven departments with
the same reach as the Croatian catalogue.

Macros carry over from the existing rows for the same product. Chicken breast
is chicken breast, and retyping eighty-five nutrition panels would only invent
transcription errors.

Prices are hand-estimated AED per kg or litre and exist to make the weekly
total realistic. They will drift, and the file says so.

Pack sizes and names follow what the two stores actually sell — metric
throughout, `pack 500 g`, `tray approx 900 g`, `bag 1 kg`.

`storeQuery` overrides are set where the display name is more specific than
what the store's search wants, and each one is checked against Union Coop's
live search by counting the products the response contains.

## The recipes

Roughly 35, written around what those two stores stock rather than translated
from the Swedish or Croatian pools: shawarma-spiced chicken, chicken machboos,
foul medames, labneh and za'atar breakfasts, grilled hammour, shish tawook,
lentil shorba, hummus bowls.

Quantities are per single serving, `fixed: true` on aromatics and seasonings.
`steps` and `stepsLocal` hold the same English text — the type requires both
fields and the region test compares their lengths.

Slot coverage is set by the existing test contract, which is the real
specification here: vegetarian, gluten-free, dairy-free and gluten + dairy-free
each need at least one option at every one of the four meal slots. Gulf cooking
makes that combination comfortable rather than tight.

## Tests

Two new cases in `regions.test.ts`, following the Konzum and Kaufland pattern:

- Union Coop is sent `q` at `/catalogsearch/result/`
- Lulu is sent `search_text` at `/en-ae/list/`, and is *not* sent `q`

A case in `i18n` covering the collapsed subtitle: matching names produce an
empty subtitle, differing names still produce the other-language name. That
second half matters more than the first — it is what proves Sweden and Croatia
were not changed.

A case on the clipboard export asserting that a UAE item exports as
`- Salmon fillet — …` with no empty brackets, and that a Swedish one still
carries its English name in brackets.

For the language cull:

- a stored language of `hr` resolves to English rather than to Swedish or to a
  raw key
- switching country keeps the language you are reading in where the new region
  offers it, and returns you to English where it does not

## Out of scope

- Arabic. The region ships English only, by decision.
- Real price data. Prices stay hand-estimated, as they are for every region.
- Any change to `DEFAULT_REGION`, the planner, or the macro maths.
- Croatia's chains, catalogue and recipes. Only its interface language moves.

Everything else in `regions.test.ts` is parameterised over
`Object.values(REGIONS)` and picks the new region up for free. That is most of
the safety net: department completeness, ingredient stocking, id uniqueness
across regions, restricted-eater coverage, and https on every chain URL.
