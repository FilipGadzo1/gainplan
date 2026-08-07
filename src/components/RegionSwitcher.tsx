import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile, RegionId } from '../types';
import { REGION_IDS } from '../types';
import { useLanguage } from '../i18n/hooks';
import { languagesFor } from '../i18n';
import { regionOf } from '../regions/registry';

/**
 * Country flags, inline SVG for the same reason the language flags are: Chrome
 * and Edge on Windows render regional-indicator emoji as the letter pair rather
 * than a flag.
 */
function FlagSe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="10" fill="#005293" />
      <rect x="5" width="2" height="10" fill="#fecb00" />
      <rect y="4" width="16" height="2" fill="#fecb00" />
    </svg>
  );
}

function FlagHr({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="3.34" fill="#ff0000" />
      <rect y="3.33" width="16" height="3.34" fill="#fff" />
      <rect y="6.66" width="16" height="3.34" fill="#171796" />
      <path
        d="M6.4 3.1h3.2v2.3a1.6 1.6 0 0 1-1.6 1.6 1.6 1.6 0 0 1-1.6-1.6z"
        fill="#fff"
        stroke="#d90000"
        strokeWidth=".4"
      />
    </svg>
  );
}

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

const FLAGS: Record<RegionId, (props: { className?: string }) => React.ReactElement> = {
  se: FlagSe,
  hr: FlagHr,
  ae: FlagAe,
};

/** Spelled out rather than built as `region.${id}` so the keys stay typed. */
const LABEL_KEY = { se: 'region.se', hr: 'region.hr', ae: 'region.ae' } as const;

/**
 * Where you shop, in the header rather than buried in Setup.
 *
 * It started life inside Setup on the reasoning that picking a country is a
 * once-a-year decision. That was wrong in practice: the app opens on the Week
 * tab whenever a plan exists, so the control was invisible unless you already
 * knew to go looking for it. Switching country is also the single most visible
 * thing the app can do, which makes hiding it the wrong trade.
 *
 * The chain picker stays in Setup. That one really is a setting, and it only
 * means anything once you have chosen a country.
 */
export default function RegionSwitcher({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const { t } = useTranslation('setup');
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (open) optionRefs.current[REGION_IDS.indexOf(profile.region)]?.focus();
  }, [open, profile.region]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

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

  const Current = FLAGS[profile.region];

  return (
    <div ref={rootRef} className="no-print relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('region.title')}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-2 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition-colors pointer-coarse:min-h-11 pointer-coarse:px-3 hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <Current className="h-3 w-5 shrink-0 rounded-[2px]" />
        <span className="hidden sm:inline">{t(LABEL_KEY[profile.region])}</span>
        <span aria-hidden className="text-[0.6rem] leading-none">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg">
          <p className="border-b border-[var(--color-line)] px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[var(--color-muted)] uppercase">
            {t('region.title')}
          </p>
          <ul
            id={menuId}
            role="listbox"
            aria-label={t('region.title')}
            onKeyDown={(e) => {
              const last = REGION_IDS.length - 1;
              const current = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement);
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                optionRefs.current[current >= last ? 0 : current + 1]?.focus();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                optionRefs.current[current <= 0 ? last : current - 1]?.focus();
              } else if (e.key === 'Home') {
                e.preventDefault();
                optionRefs.current[0]?.focus();
              } else if (e.key === 'End') {
                e.preventDefault();
                optionRefs.current[last]?.focus();
              }
            }}
            className="py-1"
          >
            {REGION_IDS.map((id, i) => {
              const Flag = FLAGS[id];
              const active = id === profile.region;
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    aria-selected={active}
                    onClick={() => choose(id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors pointer-coarse:min-h-11 ${
                      active
                        ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Flag className="h-3 w-5 shrink-0 rounded-[2px]" />
                    {t(LABEL_KEY[id])}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
