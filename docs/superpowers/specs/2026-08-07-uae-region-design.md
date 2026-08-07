# Adding the UAE as a third region

**Date:** 2026-08-07
**Status:** approved, ready for planning

GainPlan currently shops in Sweden and Croatia. This adds the UAE — Dubai —
with Union Coop and Lulu Hypermarket as its chains. The interface, the
catalogue and the recipes are all in English; the region ships no new language.

## Why this is mostly data

The region layer already carries its own weight. `Region`, `assertRegion`, the
registry and the region-scoped storage keys were built when Croatia went in,
and none of them assume two regions. Adding a third is one import and one entry
in `registry.ts` plus the data behind it.

Two things are genuinely new, and both come from this being the first region
whose own language is English.

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
accessors render one as a subtitle under the other. For this region they are
the same string, so an item would read "Salmon fillet / Salmon fillet".

`ingredientSubtitle` and `recipeSubtitle` return `''` when the two names match,
and the render sites skip the element on an empty string rather than leaving a
blank line. The data stays honest — `name` and `en` really are the same here —
and no other region changes behaviour.

`packName` / `packNameEn` collapse the same way but are never shown as a pair,
so `packName` needs no change.

`languagesFor` already returns `['en']` alone for an English region, so the
language switcher collapses to a single option without being touched.

`deptLabels` is only read when the language is *not* English, which for this
region is never. It is still required by `assertRegion` and by the "names every
department it walks" test, so it holds the English labels and carries a comment
saying it exists to satisfy the contract and does not render.

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
- `src/components/RegionSwitcher.tsx` — a UAE flag SVG and a `LABEL_KEY` entry
- `src/components/ChainMark.tsx` — two entries in `LOGOS`
- `src/i18n/locales/{sv,hr,en}/setup.json` — a `region.ae` label in each
- `src/regions/regions.test.ts` — search-parameter assertions for both chains

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

Everything else in `regions.test.ts` is parameterised over
`Object.values(REGIONS)` and picks the new region up for free. That is most of
the safety net: department completeness, ingredient stocking, id uniqueness
across regions, restricted-eater coverage, and https on every chain URL.

## Out of scope

- Arabic. The region ships English only, by decision.
- Real price data. Prices stay hand-estimated, as they are for every region.
- Any change to `DEFAULT_REGION`, the planner, or the macro maths.
