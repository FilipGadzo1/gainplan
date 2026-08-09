# Migrating GainPlan to MUI

A plan for replacing the hand-rolled component layer with [MUI](https://mui.com/),
ordered so the highest-value work lands first and the decision to continue can be
re-taken after each phase.

## Baseline, measured before starting

| | Value |
|---|---|
| Bundle (JS) | 502.08 kB raw / **141.33 kB gzip** |
| Bundle (CSS) | 27.46 kB raw / 6.00 kB gzip |
| Tests | 300 passing, 16 files |
| Runtime deps | react, react-dom, i18next, react-i18next |
| Styling | Tailwind v4 + `@theme` custom properties in `src/index.css` |

Re-measure all four after every phase. The point of recording them is to notice
if the trade stops being worth it.

### Measured outcome

Phases 0–2 were executed; phases 3–5 were **not** adopted.

| After | JS gzip | Δ | Tests |
|---|---|---|---|
| Baseline | 141.33 kB | — | 300 |
| Phase 1 (`Dialog`) | 182.95 kB | **+41.62 kB** | 308 |
| Phase 2 (`Popover` + `MenuList`) | 193.97 kB | **+11.02 kB** | 309 |
| Phase 3 (`Tabs`, `ToggleButtonGroup`, `Tooltip`, `Button`, `ConfirmDialog`) | 215.56 kB | **+21.59 kB** | 316 |

Total: **+74.23 kB gzip**, 141.33 → 215.56, for a 52% larger JS payload.

CSS went the other way: 6.00 → 5.60 kB gzip, since Tailwind no longer emits the
classes the deleted markup used.

Phase 1 landed at +41.62 kB against a ~40 kB gate. Phase 2 then cost a quarter
of that, because emotion and the system core arrive with the first component and
every one after is marginal. **The two highest-value conversions are also the
two cheapest**, and everything below them in the table at the top of this file
pays the override-writing cost with none of the behavioural return. That is the
argument for stopping here, and it is the measured version of the argument
rather than the predicted one.

Net effect on the two switchers: **206 lines deleted, 38 added**, plus a shared
`HeaderSelect.tsx` of 158 — so about 10 lines net across the three files, in
exchange for deleting every hand-rolled keyboard handler and gaining focus
restore. The win here is not line count; it is that the interaction logic is no
longer this project's problem.

## What is actually being replaced

`src/components/ui.tsx` exports nine primitives. They do not all map to MUI
equally, and sorting them by how well they map is what drives the phase order.

| Primitive | MUI equivalent | Verdict |
|---|---|---|
| `RecipeModal` (own file) | `Dialog` | **Strong win** — see below |
| `LanguageSwitcher` (own file) | `Select` / `Menu` | **Strong win** |
| `RegionSwitcher` (own file) | `Select` / `Menu` | **Strong win** |
| `Toggle` | `Switch` + `FormControlLabel` | Fair — shape differs |
| `SegmentedTabs` | `Tabs` / `ToggleButtonGroup` | Fair |
| `Pill` | `Chip` | Fair, but it is 12 lines |
| `Field` | `FormControl` + `FormLabel` + `FormHelperText` | Neutral — MUI is more verbose |
| `SegmentedControl` | `ToggleButtonGroup` | Weak — loses the hint sub-line |
| `NumberField` | `TextField` | **No gain** — the value is the draft-state logic, which survives either way |
| `MacroBar` / `MacroValue` | none | **No equivalent** — 3-segment stacked bar in three fixed hues |
| `TargetDelta` | none | **No equivalent** |
| `StoreLink` | `Link` | No gain over `<a>` |

### Where MUI genuinely pays

Three components hand-roll interaction behaviour that MUI has solved properly:

- **`RecipeModal`** handles Escape and locks body scroll (`RecipeModal.tsx:48-56`),
  but has **no focus trap and no focus restore**. Tab from an open recipe walks
  straight into the page behind it, and closing drops focus back to `<body>`
  rather than to the meal card you opened. It also puts `role="dialog"` on the
  backdrop element itself, so the overlay sits inside its own dialog. MUI
  `Dialog` fixes all of that. **These are real accessibility defects today**, not
  a refactoring preference.
- **`LanguageSwitcher`** and **`RegionSwitcher`** are the same listbox written
  twice: roving focus via `optionRefs`, Escape, outside-click, ArrowUp/ArrowDown,
  Home/End (`RegionSwitcher.tsx:86-165`, `LanguageSwitcher.tsx:45-99`). That is
  roughly 200 lines of duplicated keyboard logic across two files, and it is
  exactly what `Select` exists for.

### Where MUI costs and returns nothing

- The interface is deliberately dense: 10–11px type, tight padding, and
  `pointer-coarse:` media queries that grow targets on touch input only. MUI's
  defaults are ~14px with generous padding, so most components need `sx`
  overrides to claw the density back — frequently more code than the Tailwind
  classes they replaced.
- Two styling systems ship side by side (Tailwind + emotion) unless Tailwind is
  removed entirely, which is a much larger job than this plan.
- `src/palette.test.ts` reads the hex values straight out of `index.css` and
  asserts WCAG contrast and ≥40° hue separation. A MUI `createTheme` palette is a
  second copy of those colours — and the test's own docstring exists because
  "two copies of a palette drift".
- The print stylesheet (`@media print` in `index.css`, `.no-print`) has to be
  extended to cover emotion-injected styles and MUI's default elevation shadows.

## Phase 0 — Spike, do not merge

Prove the cost before committing to it. Timebox: one sitting.

1. `npm i @mui/material @emotion/react @emotion/styled`
2. Wrap `App` in a `ThemeProvider` with `mode: 'dark'` and the seven palette
   colours from `index.css`, plus `CssBaseline`.
3. Convert **one** component only: `RecipeModal` → `Dialog`.
4. `npm run build` and record the new gzip figure.

**Gate:** if the gzip delta for Dialog alone is more than ~40 kB, the full
migration will not pay for itself and phases 3–5 should be dropped on the spot.

## Phase 1 — The dialog

Convert `RecipeModal` to MUI `Dialog`.

- Delete the Escape listener, the scroll lock and the backdrop div; `Dialog`
  owns all three.
- Keep `aria-label={title}` via `aria-labelledby` on a `DialogTitle`.
- `PaperProps.sx` carries the surface/line colours.
- **New tests to add** (focus behaviour does not exist today; the scroll lock
  does and must not regress): focus moves into the dialog on open, Tab stays
  inside it, focus returns to the meal card on close, body scroll stays locked
  while open and is released on close.
- Print: `Dialog` renders in a portal at `<body>`, outside the `.no-print`
  tree — confirm printing the Week tab with a recipe open still works.

**Gate:** all 300 tests plus the new ones pass.

## Phase 2 — The two listboxes

Convert `LanguageSwitcher` and `RegionSwitcher` to MUI `Select`.

- Both currently expose `role="listbox"` with `role="option"` children. MUI
  `Select` renders the same roles, so `App.test.tsx` queries like
  `getByRole('option', { name })` should survive — verify rather than assume.
- Delete `optionRefs`, both `useEffect` keyboard handlers, and the outside-click
  listeners from both files.
- The flag SVGs move into `MenuItem` children and `renderValue`.
- `RegionSwitcher.test.tsx` (155 lines) and `LanguageSwitcher.test.tsx` (129
  lines) will need their open/close interactions reworked — MUI opens on
  mousedown and renders the menu in a portal.

**Gate:** the ~200 duplicated lines are gone, tests pass, bundle delta recorded.

**This is the natural stopping point.** Everything above buys real behaviour.
Everything below is a restyling exercise.

## Phase 3 — Form primitives

Convert, in this order, one PR each:

1. `Toggle` → `Switch` + `FormControlLabel`. Note the shape change: today it is a
   full-width row button with a hint line; MUI's is a switch beside a label.
   Either accept the visual change or rebuild the row with `sx`.
2. `Field` → `FormControl` + `FormLabel` + `FormHelperText`.
3. `NumberField` → keep every line of the draft/commit logic, swap only the
   `<input className="field">` for `<TextField>`. If this reads as more code than
   before, revert it — the wrapper was never the hard part.
4. `Pill` → `Chip` with `size="small"`.
5. `SegmentedTabs` → `Tabs`.
6. `SegmentedControl` → `ToggleButtonGroup`. The `hint` sub-line and `icon` need
   custom `ToggleButton` children; budget the most time here.

`SetupPanel.test.tsx` asserts `getAllByRole('tab')` and heading levels — `Tabs`
and `FormLabel` change both.

## Phase 4 — Layout and surfaces

`Card`/`Paper` for `.card`, `Button` for `.btn` / `.btn-primary`, `AppBar` for
the header, `BottomNavigation` for the mobile tab bar in `App.tsx`.

Watch for: `App.tsx` uses `min-h-dvh`, `env(safe-area-inset-bottom)` and a
`lg:overflow-hidden` shell so the desktop layout fits the viewport exactly.
`AppBar` and `BottomNavigation` bring their own positioning and will fight it.
The safe-area insets are hand-written and MUI does not handle them.

## Phase 5 — What stays custom regardless

`MacroBar`, `MacroValue`, `TargetDelta`, `ChainMark`, the day tiles in
`WeekView`, and the meal cards. MUI has no equivalent for any of them. They keep
their Tailwind classes, which means **Tailwind stays in the dependency list and
in the bundle** at the end of this migration unless they are rewritten in `sx`
as a sixth phase.

## Theme bridge

To avoid the second copy of the palette that `palette.test.ts` warns about, do
not retype the hexes into `createTheme`. Read them from the CSS custom
properties:

```ts
const v = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
```

Or extract the palette into a `.ts` module that both `index.css` (via a Vite
plugin) and `createTheme` consume. Either way, extend `palette.test.ts` to assert
the MUI theme and the CSS agree.

## Rollback

Each phase is one commit on a branch off `uae-region`. Nothing in phases 3–5
depends on anything in phases 1–2, so any phase can be reverted alone.
