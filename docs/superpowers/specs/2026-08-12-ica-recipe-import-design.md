# Importing ICA's recipe corpus

**Date:** 2026-08-12
**Status:** approved, ready for planning

Sweden ships 65 hand-written recipes. A week of real use makes the pool feel
smaller than that, because the planner never draws from all of it: 16 of the 65
are breakfast-capable before `maxMinutes` filters any out, and the scoring in
`pickRecipe` converges on the same protein-dense handful within each slot.

This imports several hundred recipes from ica.se into the Swedish region, grows
the ingredient catalogue to cover them, and makes one change to the planner so
the larger pool actually surfaces.

## What the corpus is

Measured, not assumed. `https://www.ica.se/recept/sitemaps/` publishes three
recipe sitemaps holding **23,397 URLs** — 10,000 + 10,000 + 3,397. Not the ~45k
the work was scoped against, and the difference is worth knowing before anyone
budgets time against it.

`robots.txt` allows generic user agents on `/recept/`. It names `GPTBot` and
`meta-externalagent` and disallows them from deep recipe paths; nothing else is
restricted, and the sitemaps exist to be crawled.

Every recipe page carries one `schema.org/Recipe` JSON-LD block. Across a random
sample of 800 URLs, of which 451 returned successfully:

| Field | Coverage |
| --- | --- |
| `recipeYield` | 100% |
| `totalTime` | 100% |
| `recipeCategory` | 88.9% |
| `nutrition.calories` | 69.8% |
| `nutrition.fatContent` | 67.2% |
| `nutrition.proteinContent` | 63.4% |
| `nutrition.carbohydrateContent` | 63.4% |
| **all four macros together** | **62.3%** |

The 44% of requests that failed were rate limiting at six concurrent workers,
not missing pages. That number is the reason the harvester below runs at two to
three.

**62% of recipes publish their own macros.** This is the single most useful fact
in the survey and it changes the design twice over. It is not a substitute for
our own macro maths — the planner scales portions against per-ingredient grams,
and a declared per-serving figure cannot be scaled — but it is an *oracle*. We
compute macros from our catalogue, compare against what ICA declares, and throw
away any recipe where the two disagree. That turns unit-parsing errors, the main
quality risk in the whole pipeline, from a thing we hope we got right into a
thing that fails loudly and silently drops the recipe.

`recipeCategory` maps onto `MealSlot` directly. Sample counts:

    Middag 233   Huvudrätt 232   Buffé 60   Efterrätt 44   Brunch 37
    Mellanmål 36   Förrätt 34   Fika 32   Frukost 21   Plockmat 15
    Vickning 13   Lunch 4

Breakfast is thin in the corpus — Frukost and Brunch together are about 13% —
but 13% of 23,397 is roughly 3,000 candidates against the 16 the app has now.
The scarcest slot in the app is the one this fixes hardest.

## Why the obvious approach fails

The instinct is to grow the catalogue, then import whatever it covers. The
survey says that does not work.

451 recipes contain **1,546 distinct ingredient strings**, and the count was
still climbing when sampling stopped. The median recipe has 10 ingredients, and
every one of them must resolve for the recipe to be shoppable. Ten independent
lookups against a long-tailed vocabulary compounds badly:

| Catalogue knows | Recipes fully importable |
| --- | --- |
| top 500 strings | 11.5% |
| top 800 | 23.0% |
| top 1,200 | 47.9% |

Chasing 30% coverage of random recipes means roughly a thousand ingredients,
almost all of which would be carried for one recipe each.

**So the pipeline runs the other way: select the recipes first, then grow the
catalogue to cover exactly those.** Several hundred recipes chosen partly *for*
their ingredient overlap need something like 250–350 new ingredients, not a
thousand. The coverage table above describes random recipes; it does not
describe recipes picked because we can already nearly shop for them.

The vocabulary also needs normalising before any of it resolves. The sample's
head is mostly seasoning, and it is messy in three specific ways:

- inflection — `vitlöksklyfta` (96) and `vitlöksklyftor` (81) are one ingredient
- alternatives — `smör eller margarin` (38) has to pick one
- granularity — `olja` (151), `olivolja` (168) and `rapsolja` (36) are three
  entries in the catalogue and three different fat profiles

## The pipeline

Four scripts under `scripts/ica/`, each writing a file the next one reads, so a
failed run resumes rather than restarts. `scripts/` already exists, is already
type-checked by `tsconfig.scripts.json`, and is already excluded from the app
build — nothing new is needed to hold this.

### 1. Harvest

Read the three sitemaps, fetch each recipe URL, extract the JSON-LD block,
append to `scripts/ica/data/raw.jsonl`.

Two or three concurrent requests with exponential backoff on failure, and a
resumable on-disk cache keyed by URL so an interrupted run picks up where it
stopped. At the measured failure rate this is a multi-hour unattended run; it is
also a one-off, and the output is committed so nobody has to repeat it.

### 2. Rank

Hard gates first, cheap ones before expensive ones:

- all four macros declared
- `recipeCategory` maps to a known slot
- `totalTime` at most 90 minutes. `Profile.maxMinutes` is user-set and can go
  higher, but a recipe nobody's time budget admits is dead weight in the bundle
- per-serving energy between 150 and 900 kcal — outside that it is a garnish or
  a party platter, not a meal

Then score the survivors on protein density (this is a fitness app, and
`pickRecipe` will reject a low-protein recipe anyway), slot scarcity with
breakfast weighted heavily, ingredient overlap with what the catalogue already
knows, and ICA's own `aggregateRating` where present. Take the top ~500 into
`candidates.json` — an over-selection, because stage 4 will reject some.

`totalTime` needs care. On `glad-kyckling-15` it reads `PT90M` while the method
calls for three hours of marinating, so it is neither pure hands-on time nor
true elapsed time. It feeds `minutes`, which is what `profile.maxMinutes`
filters against, so a wrong value quietly removes a recipe or wrongly admits
one. Treat it as an upper bound, cap it, and prefer under-promising.

### 3. Resolve and grow

Normalise each ingredient line to `{ quantity, unit, name }`, then resolve
`name` against the catalogue through an alias map that handles the three
messiness classes above. Convert to grams with a Swedish kitchen-unit table —
`msk`, `tsk`, `krm`, `dl`, `st`, `klyfta`, `knippe`, `nypa` — where volume
units need a per-ingredient density, because a decilitre of flour and a
decilitre of cream are not the same mass and treating them alike is precisely
the error the oracle in stage 4 exists to catch.

Every name that fails to resolve across the candidate set becomes a new
catalogue row. Per the decisions taken while designing this:

- **macros** from ICA's declared figures where the ingredient can be isolated,
  otherwise Livsmedelsverket. Their API is live and documented — 2,400 foods,
  50+ nutrients, `apiStatus: "active"` — but every list query currently returns
  `totalRecords: 0` at every language and offset. It serves an empty dataset
  today. Resolve that or fall back to their downloadable PSI dataset before
  depending on it; do not discover it mid-run.
- **`dept` and `tags`** by classification. `tags` is load-bearing: it drives the
  diet filter, and a missed `gluten` on a flour is a user eating something they
  excluded. Wrong-but-restrictive is the safe direction.
- **`pricePerKg`, `packSize`, `packName`** from category defaults derived from
  the nearest existing catalogue row. ICA's store API sits behind CloudFront and
  answers 403, so there is no automated source for these. The 30–50 entries that
  actually move a weekly total — proteins and staples — get a manual pass; the
  rest carry a plausible default, which is what every hand-written region
  already does and says so in a comment.

### 4. Emit and validate

Per-serving grams are parsed grams ÷ `recipeYield`. `slots` come from
`recipeCategory`, `minutes` from the capped `totalTime`, `fixed: true` from a
known set of seasoning and aromatic ids. `batchFriendly` is a heuristic over
`cookingMethod` and defaults to **false** when unsure — a wrong `true` means the
planner serves four-day-old fried fish, and the cost of a wrong `false` is
merely a missed batch-cook.

`stepsLocal` is ICA's Swedish verbatim. `steps` is an English translation, step
for step: `regions.test.ts:61` asserts the two arrays are the same length, so
the translation may never merge or split a step.

Then the oracle. Compute macros from the resolved ingredients and compare with
ICA's declared per-serving figures. **A recipe is dropped if computed energy
diverges from declared by more than 25%, or computed protein by more than 30%** —
energy because it catches almost every unit error, protein because it is the
macro the planner selects on and the one a fat/carb error hides behind. Each
rejection is logged with its parse, so the alias map and density table improve
from real failures rather than from guesses. Recipes that fail to fully resolve
are dropped for the same reason: a meal that breaks the shopping list is broken
in this app, even if the planner could technically schedule it.

Survivors are written to generated files.

## What changes

### New files

- `scripts/ica/harvest.ts`, `rank.ts`, `resolve.ts`, `emit.ts`
- `scripts/ica/units.ts` — the unit and density table
- `scripts/ica/aliases.ts` — the ingredient alias map
- `scripts/ica/data/raw.jsonl`, `candidates.json`, `rejected.json` — the last
  being the record of what the oracle threw out and why
- `src/data/recipes.generated.ts` — `ICA_RECIPES`
- `src/data/ingredients.generated.ts` — `ICA_INGREDIENTS`

Generated data stays in its own files rather than being merged into
`recipes.ts` and `ingredients.ts`. The 65 hand-written recipes stay
authoritative and readable, and the import stays regenerable without a diff
that touches curated work.

### Edited files

- `src/data/recipes.ts` — `ICA_RECIPES` into the `RECIPES_BY_ID` spread
- `src/data/ingredients.ts` — `ICA_INGREDIENTS` into the `INGREDIENTS` spread
- `src/regions/se.ts` — `recipes: [...RECIPES, ...ICA_RECIPES]` and
  `ingredients: [...INGREDIENT_LIST, ...ICA_INGREDIENTS]`

Both spreads matter. `regions.test.ts:86` and `:103` assert that the shared
lookups hold exactly what the regions hold — the check that caught the UAE
shipping unbuildable — so adding to the region without adding to the lookup
fails the suite rather than failing at runtime.

Every generated id carries an `ica-` prefix, for the cross-region uniqueness
tests at `regions.test.ts:75` and `:89`.

### The planner

`pickRecipe` scores with `stretch * 3 + shortfall + excess + repeat + overuse +
rng() * 1.4` (`src/lib/planner.ts:175`). The stretch term is deliberately
uncapped, and at weight 3 it dominates the 1.4 of randomness, so for a given
slot energy the same recipes win regardless of how many exist. Importing 500
recipes without touching this would surface a similar week to the one that
prompted the work.

The change is to let the pool matter: soften stretch's dominance and raise the
exploration term, so that recipes which merely fit well rather than best get
picked sometimes.

This ships **first and separately**, before any import. It is a small change to
one scoring line, it is testable against the existing 65 recipes, and shipping
it alone is what tells us how much of the boredom was scoring rather than pool
size. Making both changes at once would leave that question permanently
unanswered.

## Tests

The existing suite already covers most of the risk, because it is parameterised
over regions and picks generated data up for free: ingredient stocking, real
departments, step-count parity, cross-region id uniqueness, and the shared
lookup completeness checks.

Two of those become genuinely load-bearing rather than incidental. "Stocks every
ingredient its recipes call for" is the test that catches an unresolved import,
and step-count parity is what catches a translation that restructured a method.

New, on the scripts:

- the unit table converts each Swedish unit to the mass it should, including the
  volume units whose answer depends on the ingredient
- the alias map folds inflections, resolves `x eller y` to one ingredient, and
  keeps `olja` / `olivolja` / `rapsolja` distinct
- the oracle rejects a recipe whose computed macros diverge from the declared
  ones, using a fixture built from a real harvested recipe with a deliberately
  wrong density

New, on the data:

- `regions.test.ts` gains a floor per slot per region, replacing the current
  "greater than 0". The comment there notes Sweden "scrapes through breakfast
  and snack with a single recipe each" — after this import that is no longer
  true, and the floor should be raised to say so.

## Out of scope

- Croatia and the UAE. This is the Swedish region only.
- Live prices. They stay hand-estimated, as in every region.
- Any change to the macro maths, `Ingredient`, or `Recipe`. The import produces
  data in the shapes that already exist.
- Recipes that are not fully shoppable, however good their macros.
- The remaining ~22,900 recipes. The corpus is harvested once and kept; a later
  pass can select more from `raw.jsonl` without re-scraping anything.
