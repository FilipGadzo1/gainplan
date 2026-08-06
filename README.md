# GainPlan

A weekly meal planner for people who lift. You enter your numbers, it works out your
calorie and macro targets, fills seven days with high-protein meals **scaled to hit
those targets**, batches what can be batched, and turns the week into one shopping list
sorted the way you walk **ICA Kvantum Uppsala (Gränby Centrum)**.

No account, no backend, no API keys. Everything runs in the browser and is stored in
`localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 77 tests
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
  data/ingredients.ts   ~85 ICA products: macros per 100 g, SEK/kg, pack size, department
  data/recipes.ts       65 recipes, quantities per single serving
  lib/nutrition.ts      BMR, TDEE, targets, macro maths
  lib/planner.ts        Selection, leftovers, portion optimisation, batch grouping
  lib/shopping.ts       Aggregation, pack rounding, ICA store details
  lib/storage.ts        localStorage persistence
  components/           UI
scripts/sample.ts       Prints a generated week to the terminal (npx vite-node scripts/sample.ts)
```

## The ICA integration, honestly

ICA has no public API, and the online store requires a login and blocks scraping. So
GainPlan does not read live prices or push a cart. What it does instead:

- Groups your list by real ICA store departments so you shop in one pass.
- Uses typical shelf prices to estimate the weekly cost — **an estimate, not a receipt.**
  Prices drift; treat the total as a planning figure.
- Deep-links to ICA Handla Online for store `1003871` (ICA Kvantum Uppsala, Marknadsgatan 1,
  Gränby Centrum) and gives you the list as copyable text.

If you want real prices later, `src/lib/shopping.ts` is the only file that would need to
change.

## Known limits

- Recipe and ingredient data is hand-curated. Macros follow Livsmedelsverket and
  manufacturer declarations, but portion realism is a judgement call, not a lab result.
- Protein typically lands above your g/kg target (~2.7 g/kg when you ask for 2.0) because
  the recipe pool is protein-dense by design. Harmless, but it costs money — lower
  `proteinPerKg` if you want the planner to reach for carbier meals.
- Swedish is primary for every recipe title and ingredient, so the shopping list matches
  the shelf labels at ICA; the English translation sits underneath in italics.
- Data lives in one browser. Clearing site data clears your plan.
