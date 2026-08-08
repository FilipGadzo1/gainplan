# GainPlan

A weekly meal planner for people who lift. You enter your numbers, it works out your
calorie and macro targets, fills seven days with high-protein meals **scaled to hit
those targets**, batches what can be batched, and turns the week into one shopping list
sorted the way you walk your actual shop.

Three regions: **Sweden** (ICA Kvantum Uppsala, Gränby Centrum), **Croatia** (Konzum or
Kaufland), and the **United Arab Emirates** (Dubai, Union Coop or Lulu, priced in AED).
Picking a country switches the food, the recipes, the prices and the aisle order, and each
country keeps its own week. Language is a separate choice: it keeps your current language
where the new region offers it, and falls back to English otherwise.

No account, no backend, no API keys. Everything runs in the browser and is stored in
`localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 300 tests
npm run build    # static site in dist/
```

## What it does

**Targets.** Mifflin-St Jeor BMR × activity factor, adjusted for your goal (cut −20%,
maintain, lean bulk +10%, bulk +20%). Protein is set in g/kg bodyweight, fat as a share
of calories, carbs take the remainder. You can override the calorie number outright.

**Training-day calorie cycling.** Mark your training days and they get +10% while rest
days give the same amount back, so the weekly total is unchanged. Verified by a test.

**Plan generation.** For each meal slot the planner picks a recipe by scoring calorie
fit, how close the recipe's protein density is to your target ratio, how recently you
ate it, and a seeded random tiebreak. Then coordinate descent adjusts every portion size
until the day lands on its targets while each meal stays near its intended share of the
day. Days land within 6% of the calorie target and at ≥90% of the protein target across
nine different profiles — vegetarian, gluten free, dairy free, 4200 kcal bulk, 1770 kcal
cut, and so on.

**Cook once, eat twice.** Batch-friendly dinners become the next day's lunch, capped at
three per week so it does not turn into the same meal every day. The Prep tab groups
repeated recipes into cook sessions with combined quantities, never spanning more than a
four-day fridge window.

**Cooking for other people.** Add anyone else who eats these meals, each with a portion
size relative to yours rather than a headcount — a partner needing ~1900 kcal against your
3000 sits around 65%, not 100%. Shopping quantities, batch-cook amounts and costs scale by
the total; your plan and macros do not, because the week is still built around your plate.
A switch at the top of the Week tab flips the entire plan between your own plate and the
whole household in one click — each meal then lists its main ingredients at cooking
quantities, so you never have to open a recipe to know how much to put in the pan. The
recipe view follows the same switch. Shopping and prep always cover everyone regardless,
since a list that only fed one of you would be worse than useless.

Worth knowing: a solo week already wastes about half of what it buys to pack rounding —
you take home a 2 kg bag of potatoes to cook 260 g — so a second eater absorbs most of that
slack. 1.65× the food is only about 1.22× the bill.

**Shopping list.** Aggregates the whole week, rounds up to real ICA pack sizes, groups by
department in walking order (Frukt & Grönt → Kött & Chark → Fisk → Mejeri → Bröd → Fryst →
Skafferi), and totals the cost. Pantry staples are capped at one pack and flagged "kolla
hemma". Check items off as you shop, copy the list as text, print it, or open ICA Handla
Online for the Gränby store.

**Per-meal control.** Swap a meal for a different one, lock a meal so it survives a
regenerate, nudge any portion by 5% at a time, or block a recipe permanently.

**Weigh-in tracking.** Log your weight, see the trend, and get a concrete calorie
adjustment based on your goal and your actual rate of change.

## Stack

Vite + React 19 + TypeScript (strict) + Tailwind v4. Vitest for tests. No runtime
dependencies beyond React.

```
src/
  types.ts              Domain types
  regions/              What differs by country
    index.ts            Region and Chain shapes, plus assertRegion
    registry.ts         Every region by id, and the lookup
    se.ts               Sweden: ICA, SEK, Swedish aisle order
    hr/                 Croatia: Konzum and Kaufland, EUR, 51 recipes
    ae/                 United Arab Emirates: Union Coop and Lulu, AED, 37 recipes
  data/ingredients.ts   88 ICA products: macros per 100 g, SEK/kg, pack size, department
  data/recipes.ts       65 Swedish recipes, quantities per single serving
  lib/nutrition.ts      BMR, TDEE, targets, macro maths
  lib/planner.ts        Selection, leftovers, portion optimisation, batch grouping
  lib/shopping.ts       Aggregation, pack rounding, chain deep links
  lib/storage.ts        localStorage persistence, namespaced per region
  components/           UI
scripts/sample.ts       Prints a generated week to the terminal
                        (npx vite-node scripts/sample.ts [se|hr|ae])
```

Ingredient and recipe ids are unique across regions — Croatian rows carry an `hr-`
prefix, UAE rows an `ae-` prefix — because the two registries in `data/` are shared and
the region only filters them. A test enforces it.

## The store integrations, honestly

No chain here is integrated in the sense of an API. Prices are hand-typed shelf
estimates in all three — **an estimate, not a receipt.** They drift; treat the
total as a planning figure.

What the app does do is group your list by that shop's real departments in walking
order, and link each ingredient into the chain's own product search where the chain
has one that a URL can reach.

Which chains can be deep-linked, and why:

| Chain | Deep link | Why |
|---|---|---|
| ICA | yes | Search results only — ICA publishes no "add to basket" URL |
| Konzum | yes | `search[term]`, taken from their own search form |
| Kaufland | no | Only a site-wide search; it answers with recipes and news too |
| Union Coop | yes | `/catalogsearch/result/?q=` — server-rendered, so its results can be counted |
| Lulu | yes | `/en-ae/list/?search_text=` — the search path Lulu's own schema.org markup publishes |

Croatian ingredient names were checked against Konzum's live catalogue by counting the
products each query actually returns; 25 rows carry a `storeQuery` override where the
display name finds nothing on the shelf.

**Croatia is where real prices are actually possible.** Government decision NN 75/2025
requires every chain to publish daily price lists in machine-readable form, and
[cijene.dev](https://cijene.dev/) aggregates them. Wiring that up means a build-time
fetch rather than a runtime one, since an API key cannot live in a static site. The
enriched product data is CC BY-NC-SA 4.0, which is worth reading before relying on it.

## Known limits

- Recipe and ingredient data is hand-curated. Macros follow Livsmedelsverket and
  manufacturer declarations, but portion realism is a judgement call, not a lab result.
- Protein typically lands above your g/kg target (~2.7 g/kg when you ask for 2.0) because
  the recipe pool is protein-dense by design. Harmless, but it costs money — lower
  `proteinPerKg` if you want the planner to reach for carbier meals.
- Each region's own product and recipe names are primary, matching the shelf labels you'd
  actually shop off; the English translation sits underneath in italics, except for a
  region whose own language is English (the UAE), where there is no second line to show.
- Data lives in one browser. Clearing site data clears your plan.
