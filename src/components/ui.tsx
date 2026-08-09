import { useId, useState, type ReactNode } from 'react';
import MuiButton, { type ButtonProps } from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { Ingredient, Macros } from '../types';
import { chainSearchUrl } from '../lib/shopping';
import { ingredientName } from '../i18n/content';
import { useLanguage } from '../i18n/hooks';
import { useRegion } from '../regions/context';

/** Grams, kilos and kilocalories, written the way the reader's language writes them. */
const parseNumber = (raw: string): number => Number(raw.trim().replace(',', '.'));

/**
 * A number input you can actually type into.
 *
 * The two ends of the range are not symmetrical, and treating them as if they
 * were is what made this component tricky.
 *
 * *Below* the minimum has to be left alone while you type: "2" on the way to
 * "28" is under a minimum of 14, and clamping it per keystroke snaps the field
 * to 14 and makes any two-digit number unreachable. Same for an empty field,
 * which reads as 0. So a too-small value stays as raw text and is only clamped
 * on blur, once you have plainly finished.
 *
 * *Above* the maximum is clamped immediately, because no number can be rescued
 * by typing more of it — digits only make it larger. Leaving it uncommitted
 * instead meant the field could show 500 while the app had been handed the 50
 * you passed through on the way, and the two only agreed again on blur.
 *
 * A text input rather than `type="number"`, for three reasons. The visible one
 * is the pair of spinner arrows browsers bolt onto a number field, which are
 * ugly and which nobody uses. The one that actually mattered is the decimal
 * separator: Swedish and Croatian both write 82,5, and a number input hands
 * back an empty string the moment a comma is typed — so the `replace(',', '.')`
 * below had never once run on a real comma. The third is the scroll wheel,
 * which silently edits a focused number field as the page moves under it.
 *
 * `inputMode="decimal"` keeps the numeric keypad on a phone, and ArrowUp and
 * ArrowDown keep the one genuinely useful thing the spinners did.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  allowEmpty = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  /** Arrow-key increment. */
  step?: number;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === null ? '' : String(value));

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = () => {
    if (draft === null) return;
    if (draft.trim() === '') {
      if (allowEmpty) onChange(null);
    } else {
      const n = parseNumber(draft);
      if (Number.isFinite(n)) onChange(clamp(n));
    }
    setDraft(null);
  };

  /** Steps off whatever is on screen, so it follows a half-finished edit. */
  const nudge = (direction: 1 | -1) => {
    const typed = parseNumber(shown);
    const from = Number.isFinite(typed) && shown.trim() !== '' ? typed : (value ?? min);
    // Re-rounded to the step's own precision: 0.27 + 0.01 is not 0.28 in binary
    // floating point, and the fat slider would drift a digit at a time.
    const decimals = (String(step).split('.')[1] ?? '').length;
    setDraft(null);
    onChange(Number(clamp(from + direction * step).toFixed(decimals)));
  };

  return (
    <TextField
      fullWidth
      hiddenLabel
      slotProps={{ htmlInput: { inputMode: 'decimal', autoComplete: 'off' } }}
      value={shown}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw.trim() === '') {
          setDraft(raw);
          if (allowEmpty) onChange(null);
          return;
        }
        const n = parseNumber(raw);
        // Held at the ceiling rather than allowed to run past it and be
        // corrected later — see the note above on why the floor is different.
        if (Number.isFinite(n) && n > max) {
          setDraft(String(max));
          onChange(max);
          return;
        }
        setDraft(raw);
        if (Number.isFinite(n) && n >= min) onChange(n);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          // Otherwise the caret jumps to one end of the text.
          e.preventDefault();
          nudge(e.key === 'ArrowUp' ? 1 : -1);
        }
      }}
    />
  );
}

export function MacroBar({
  macros,
  target,
  compact = false,
  barOnly = false,
}: {
  macros: Macros;
  target?: Macros;
  /** Drops the per-gram targets, for space-constrained columns. */
  compact?: boolean;
  /** Just the coloured bar, for the day tiles. */
  barOnly?: boolean;
}) {
  const { t } = useTranslation('common');
  const kcalFromP = macros.protein * 4;
  const kcalFromC = macros.carbs * 4;
  const kcalFromF = macros.fat * 9;
  const sum = Math.max(kcalFromP + kcalFromC + kcalFromF, 1);

  const parts = [
    { key: 'p', pct: (kcalFromP / sum) * 100, color: 'var(--color-protein)' },
    { key: 'c', pct: (kcalFromC / sum) * 100, color: 'var(--color-carbs)' },
    { key: 'f', pct: (kcalFromF / sum) * 100, color: 'var(--color-fat)' },
  ];

  const bar = (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-raised)]">
      {parts.map((p) => (
        <div key={p.key} style={{ width: `${p.pct}%`, background: p.color }} />
      ))}
    </div>
  );

  if (barOnly) return bar;

  return (
    <div>
      {bar}
      <div
        className={`tnum mt-1.5 flex flex-wrap gap-y-1 ${
          compact ? 'gap-x-2.5 text-[10px]' : 'gap-x-4 text-xs'
        }`}
      >
        <MacroValue
          label={t('macros.proteinShort')}
          value={macros.protein}
          target={compact ? undefined : target?.protein}
          color="var(--color-protein)"
        />
        <MacroValue
          label={t('macros.carbsShort')}
          value={macros.carbs}
          target={compact ? undefined : target?.carbs}
          color="var(--color-carbs)"
        />
        <MacroValue
          label={t('macros.fatShort')}
          value={macros.fat}
          target={compact ? undefined : target?.fat}
          color="var(--color-fat)"
        />
      </div>
    </div>
  );
}

function MacroValue({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target?: number;
  color: string;
}) {
  const { t } = useTranslation('common');
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-semibold">{Math.round(value)}</span>
      {target !== undefined && (
        <span className="text-[var(--color-muted)]">
          / {Math.round(target)} {t('units.gram')}
        </span>
      )}
    </span>
  );
}

/** A number against its target, coloured by how far off it is. */
export function TargetDelta({
  actual,
  target,
  unit = '',
  /** Overridable so the day tiles can set it smaller than the default. */
  className = 'text-xs',
}: {
  actual: number;
  target: number;
  unit?: string;
  className?: string;
}) {
  const diff = actual - target;
  const pct = Math.abs(diff) / Math.max(target, 1);
  const color = pct < 0.04 ? 'var(--color-accent)' : pct < 0.1 ? 'var(--color-carbs)' : 'var(--color-fat)';
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`tnum font-semibold ${className}`} style={{ color }}>
      {sign}
      {Math.round(diff)}
      {unit}
    </span>
  );
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'muted';
}) {
  // `outlined` for the quiet tone only — the other two are filled surfaces, so
  // a row of pills reads as a row of chips rather than a row of empty boxes.
  return (
    <Chip
      size="small"
      label={children}
      variant={tone === 'muted' ? 'outlined' : 'filled'}
      color={tone === 'accent' ? 'primary' : 'default'}
      sx={
        tone === 'accent'
          ? {
              // Tonal, not solid: these sit four to a row under a recipe title
              // and a row of saturated accent blocks would outshout it.
              backgroundColor: 'color-mix(in srgb, #57aefa 18%, transparent)',
              color: 'var(--color-accent)',
            }
          : undefined
      }
    />
  );
}

/**
 * A yes/no question, replacing `window.confirm`.
 *
 * The native one blocks the main thread while it is up, cannot be styled or
 * translated beyond its message, renders in the browser's chrome rather than
 * the app's, and is suppressed outright by some mobile browsers — which would
 * silently turn "erase everything" into a no-op.
 *
 * The destructive action is *not* the default focus. Dialog focuses the first
 * tabbable element, and here that is Cancel deliberately: an accidental Enter
 * on a confirmation should keep your data, not delete it.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth="xs"
      fullWidth
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgb(0 0 0 / 0.7)' } } }}
    >
      <p id={titleId} className="px-5 pt-5 pb-1 text-sm leading-relaxed font-semibold">
        {title}
      </p>
      <div className="flex flex-wrap justify-end gap-2 p-4">
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          sx={{
            borderColor: 'var(--color-fat)',
            color: 'var(--color-fat)',
            '&:hover': {
              backgroundColor: 'color-mix(in srgb, var(--color-fat) 12%, transparent)',
              borderColor: 'var(--color-fat)',
            },
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

/**
 * A tooltip that a phone and a keyboard can both reach.
 *
 * The native `title` attribute this replaces was effectively desktop-mouse-only:
 * it never appears on touch, needs about a second of hover, cannot be styled,
 * and screen readers treat it inconsistently. That mattered here because the
 * text hidden in it is the fallback for a name the layout has truncated — so on
 * a phone, the fallback did not exist.
 *
 * `describeChild` is not optional. Without it MUI publishes the tooltip as the
 * child's `aria-label`, which *replaces* the accessible name — an ingredient
 * link would stop answering to the ingredient's own name. With it, the tooltip
 * becomes `aria-describedby` and the name is left alone.
 */
export function Hint({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Tooltip
      title={title}
      describeChild
      // Touch: show on tap-and-hold immediately rather than never.
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: 'var(--color-raised)',
            border: '1px solid var(--color-line)',
            color: 'var(--color-text)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            lineHeight: 1.5,
            px: 1,
            py: 0.75,
            maxWidth: '18rem',
          },
        },
      }}
    >
      {children as React.ReactElement}
    </Tooltip>
  );
}

/**
 * An ingredient name that opens the chain's own online search for it. Shared by
 * the shopping list, the week and the prep view so the affordance looks the same
 * wherever an ingredient is named. The arrow is dropped from print output.
 */
export function StoreLink({
  ingredient,
  className = '',
}: {
  ingredient: Ingredient;
  className?: string;
}) {
  const { t } = useTranslation('shopping');
  const { language } = useLanguage();
  const { chain } = useRegion();
  const href = chainSearchUrl(chain, ingredient);
  const name = ingredientName(ingredient, language);

  // Not every chain has a search to link to — a region can list a shop for its
  // prices and aisle order alone. Those get plain text rather than a dead link.
  if (!href) return <span className={className}>{name}</span>;

  // Names truncate in the narrow week and prep columns, so the tooltip carries
  // the full local and English name as well as where the link goes. The search
  // itself always uses the local term — that is what the chain indexes.
  const title = `${ingredient.name} — ${ingredient.en} · ${t('searchAt', { store: chain.name })}`;
  return (
    <Hint title={title}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`hover:text-[var(--color-accent)] hover:underline ${className}`}
      >
        {name}
        <span className="no-print ml-1 text-[0.85em] text-[var(--color-muted)]">↗</span>
      </a>
    </Hint>
  );
}

/**
 * The app's button, on MUI.
 *
 * Everything here is an override. MUI ships a 64px-wide, uppercase, shadowed,
 * 6px-radius button and this app wants a compact, sentence-case, flat one, so
 * the whole of `.btn` had to be restated as `sx` — which is the honest cost of
 * this particular conversion. What it buys over the CSS class it replaced is
 * one definition instead of two (a class plus a `<button type="button">` every
 * caller had to remember) and the ripple.
 *
 * `type="button"` is defaulted here because MUI, like HTML, defaults to
 * "submit", and a stray submit inside a form is a page reload.
 */
export function Button({
  tone = 'default',
  ...props
}: Omit<ButtonProps, 'variant' | 'color'> & {
  tone?: 'default' | 'primary';
  /*
   * MUI types Button against whatever it renders as, so `ButtonProps` alone
   * knows nothing about `href` or `target`. Two callers render a link that
   * looks like a button — the store's site, a recipe's source — so the anchor
   * attributes are spelled out rather than making every call site carry a
   * generic parameter.
   */
  component?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
}) {
  /*
   * Thin on purpose. Everything this used to override — radius, padding,
   * casing, weight, the hover — is theme now, so the only job left is picking
   * the variant and defaulting `type`, which MUI leaves as "submit" like HTML
   * does. A stray submit inside a form is a page reload.
   *
   * `text` is MUI's flat variant, themed here as a *tonal* button: a filled
   * surface rather than an outline, which is what keeps a secondary action from
   * looking like an empty input.
   */
  return <MuiButton type="button" variant={tone === 'primary' ? 'contained' : 'text'} {...props} />;
}

/** Identifies the tab for a value, so its panel can point back at it. */
export const tabId = (group: string, value: string) => `${group}-tab-${value}`;
/** The one panel the tabs in a group swap the contents of. */
export const tabPanelId = (group: string) => `${group}-panel`;

/**
 * Real tabs, for splitting a long page into sections that each fit the screen.
 *
 * This used to be a hand-rolled row that declared `role="tablist"` and
 * `role="tab"` and then honoured neither: no arrow-key movement between tabs,
 * no `aria-controls`, and no `role="tabpanel"` anywhere in the app. Announcing
 * the tab role tells a screen-reader user to expect both. MUI `Tabs` supplies
 * the roving tabindex and the arrow keys.
 *
 * The panel is the caller's, because only the caller knows where its content
 * lives — see `TabPanel` and SetupPanel. There is one panel per group rather
 * than one per tab: the sections swap in and out of the same scrolling box, and
 * pointing `aria-controls` at a panel that only exists while its own tab is
 * selected would leave the other tabs referencing nothing.
 */
export function SectionTabs<T extends string>({
  group,
  value,
  onChange,
  options,
  className = '',
}: {
  /** Namespace for the generated tab and panel ids. */
  group: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <Tabs value={value} onChange={(_, v: T) => onChange(v)} className={className}>
      {options.map((o) => (
        <Tab
          key={o.value}
          value={o.value}
          label={o.label}
          id={tabId(group, o.value)}
          aria-controls={tabPanelId(group)}
        />
      ))}
    </Tabs>
  );
}

/**
 * The box a `SectionTabs` group swaps its sections through. Labelled by
 * whichever tab is currently selected, so a screen reader entering the panel is
 * told which section it landed in.
 *
 * No `tabIndex` here: the APG only asks for a focusable panel when it holds
 * nothing focusable of its own, and every section of this form is fields.
 */
export function TabPanel({
  group,
  value,
  className = '',
  children,
}: {
  group: string;
  /** The selected tab. */
  value: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(group)}
      aria-labelledby={tabId(group, value)}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * A two-or-more-way switch that looks like the tabs above but is not one.
 *
 * The household scope switch wore `role="tab"` for a while purely because it
 * shared their styling. "Your plate" and "the whole pan" are not tabs — they do
 * not reveal panels, they change what the page already shows — so they are
 * pressed buttons, and announce as such.
 */
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  /** Names the group, since the buttons alone do not say what they switch. */
  label: string;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      aria-label={label}
      // `next` is null when the pressed button is the active one. Re-pressing
      // the current scope should do nothing, not clear the selection.
      onChange={(_, next: T | null) => next !== null && onChange(next)}
    >
      {options.map((o) => (
        <ToggleButton key={o.value} value={o.value}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** A labelled group of controls. The label is the theme's `overline` role. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <Typography variant="overline" component="span" className="mb-2 block" color="text.secondary">
        {label}
      </Typography>
      {children}
      {hint && (
        <Typography variant="caption" component="span" className="mt-1.5 block">
          {hint}
        </Typography>
      )}
    </div>
  );
}

/**
 * A row or grid of mutually exclusive choices.
 *
 * These were bordered rectangles with a rounded corner and a dark fill, which
 * is precisely what the age and weight inputs beside them looked like — you
 * could not tell what to click and what to type into. As filled toggle buttons
 * that ambiguity is gone: the choices are solid, the inputs are underlined.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  columns,
}: {
  /** `icon` renders before the label, for options that carry a mark. */
  options: { value: T; label: string; hint?: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  /** Tailwind grid-column classes; these lay out in a grid, not a row. */
  columns?: string;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, next: T | null) => next !== null && onChange(next)}
      className={`gap-1.5 ${columns ?? 'grid-cols-2 sm:grid-cols-3'}`}
      // Grid rather than the default inline row: several of these are five
      // options that have to wrap into two columns to fit the card.
      sx={{ display: 'grid' }}
    >
      {options.map((o) => (
        <ToggleButton
          key={String(o.value)}
          value={o.value}
          sx={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 0 }}
        >
          <span className="flex items-center gap-1.5 font-semibold">
            {o.icon}
            {o.label}
          </span>
          {o.hint && (
            <span className="text-[0.75rem] leading-tight font-normal opacity-70">{o.hint}</span>
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  // The switch is MUI's; the row around it is not, because the hint line under
  // the label is more than FormControlLabel wants to carry. Losing the border
  // is the point — this used to be one more outlined box in a column of them.
  return (
    <label className="flex w-full cursor-pointer items-center justify-between gap-3 py-1">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-[var(--color-muted)]">{hint}</span>}
      </span>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
