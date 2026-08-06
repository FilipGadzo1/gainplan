import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Ingredient, Macros } from '../types';
import { ICA_STORE, icaSearchUrl } from '../lib/shopping';
import { ingredientName } from '../i18n/content';
import { useLanguage } from '../i18n/hooks';

/**
 * A number input you can actually type into.
 *
 * Clamping on every keystroke makes a field unusable: typing "2" towards "28"
 * in a field with a minimum of 14 snaps straight to 14, and clearing the field
 * reads as 0 and snaps to the minimum too. So while the field is being edited we
 * keep the raw text and only push a value upstream once it is already in range.
 * Anything out of range is clamped on blur, when the user has finished typing.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  allowEmpty = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step?: number;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === null ? '' : String(value));

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim().replace(',', '.');
    if (trimmed === '') {
      if (allowEmpty) onChange(null);
    } else {
      const n = Number(trimmed);
      if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
    }
    setDraft(null);
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      className="field tnum"
      value={shown}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw === '') {
          if (allowEmpty) onChange(null);
          return;
        }
        const n = Number(raw);
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
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
export function TargetDelta({ actual, target, unit = '' }: { actual: number; target: number; unit?: string }) {
  const diff = actual - target;
  const pct = Math.abs(diff) / Math.max(target, 1);
  const color = pct < 0.04 ? 'var(--color-accent)' : pct < 0.1 ? 'var(--color-carbs)' : 'var(--color-fat)';
  const sign = diff > 0 ? '+' : '';
  return (
    <span className="tnum text-xs font-semibold" style={{ color }}>
      {sign}
      {Math.round(diff)}
      {unit}
    </span>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  const tones = {
    default: 'bg-[var(--color-raised)] text-[var(--color-text)] border-[var(--color-line)]',
    accent: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30',
    muted: 'bg-transparent text-[var(--color-muted)] border-[var(--color-line)]',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * An ingredient name that opens ICA Handla Online's search for it. Shared by the
 * shopping list, the week and the prep view so the affordance looks the same
 * wherever an ingredient is named. The arrow is dropped from print output.
 */
export function IcaLink({
  ingredient,
  className = '',
}: {
  ingredient: Ingredient;
  className?: string;
}) {
  const { t } = useTranslation('shopping');
  const { language } = useLanguage();

  // Names truncate in the narrow week and prep columns, so the tooltip carries
  // the full Swedish and English name as well as where the link goes. The
  // search itself is always the Swedish term — that is what ICA indexes.
  const title = `${ingredient.name} — ${ingredient.en} · ${t('searchAt', { store: ICA_STORE.name })}`;
  return (
    <a
      href={icaSearchUrl(ingredient)}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`hover:text-[var(--color-accent)] hover:underline ${className}`}
    >
      {ingredientName(ingredient, language)}
      <span className="no-print ml-1 text-[0.85em] text-[var(--color-muted)]">↗</span>
    </a>
  );
}

/**
 * A compact tab row. Used for the household scope switch and for splitting long
 * pages into sections that each fit the screen.
 */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              active
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  );
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  columns,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${columns ?? 'grid-cols-2 sm:grid-cols-3'}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
              active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12'
                : 'border-[var(--color-line)] bg-[var(--color-raised)] hover:border-[var(--color-muted)]'
            }`}
          >
            <span className={`block text-sm font-semibold ${active ? 'text-[var(--color-accent)]' : ''}`}>
              {o.label}
            </span>
            {o.hint && <span className="block text-[11px] leading-tight text-[var(--color-muted)]">{o.hint}</span>}
          </button>
        );
      })}
    </div>
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
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-3 py-2.5 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-[var(--color-muted)]">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line)]'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
            checked ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}
