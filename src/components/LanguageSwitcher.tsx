import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languagesFor, type Language } from '../i18n';
import { useRegion } from '../regions/context';
import { useLanguage } from '../i18n/hooks';

/**
 * Flags are inline SVG rather than emoji on purpose: Chrome and Edge on Windows
 * do not render regional-indicator emoji as flags at all, they fall back to the
 * letter pair ("SE", "GB"). SVG looks the same everywhere.
 */
function FlagSv({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="10" fill="#005293" />
      <rect x="5" width="2" height="10" fill="#fecb00" />
      <rect y="4" width="16" height="2" fill="#fecb00" />
    </svg>
  );
}

function FlagEn({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="10" fill="#012169" />
      <path d="M0 0l16 10M16 0L0 10" stroke="#fff" strokeWidth="2" />
      <path d="M0 0l16 10M16 0L0 10" stroke="#c8102e" strokeWidth="1.2" />
      <path d="M8 0v10M0 5h16" stroke="#fff" strokeWidth="3.2" />
      <path d="M8 0v10M0 5h16" stroke="#c8102e" strokeWidth="1.9" />
    </svg>
  );
}

function FlagHr({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="3.34" fill="#ff0000" />
      <rect y="3.33" width="16" height="3.34" fill="#fff" />
      <rect y="6.66" width="16" height="3.34" fill="#171796" />
      <path d="M6.4 3.1h3.2v2.3a1.6 1.6 0 0 1-1.6 1.6 1.6 1.6 0 0 1-1.6-1.6z" fill="#fff" stroke="#d90000" strokeWidth=".4" />
    </svg>
  );
}

const FLAGS: Record<Language, (props: { className?: string }) => React.ReactElement> = {
  sv: FlagSv,
  en: FlagEn,
  hr: FlagHr,
};

/** Spelled out rather than built as `language.${lang}` so the keys stay typed. */
const LABEL_KEY = { sv: 'language.sv', en: 'language.en', hr: 'language.hr' } as const;

export default function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useLanguage();
  const { region } = useRegion();
  const languages = languagesFor(region.language);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  // Opening moves focus onto the active option, so the menu is usable from the
  // keyboard without tabbing through it.
  useEffect(() => {
    if (open) optionRefs.current[languages.indexOf(language)]?.focus();
  }, [open, language, languages]);

  // Close on Escape or on a click that lands outside the control.
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

  const Current = FLAGS[language];

  const choose = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="no-print relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('language.label')}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-2 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <Current className="h-3 w-5 shrink-0 rounded-[2px]" />
        <span className="hidden sm:inline">{t(LABEL_KEY[language])}</span>
        <span aria-hidden className="text-[0.6rem] leading-none">
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label={t('language.label')}
          onKeyDown={(e) => {
            const last = languages.length - 1;
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
          className="absolute right-0 z-40 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1 shadow-lg"
        >
          {languages.map((lang, i) => {
            const Flag = FLAGS[lang];
            const active = lang === language;
            return (
              <li key={lang}>
                <button
                  type="button"
                  role="option"
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  aria-selected={active}
                  onClick={() => choose(lang)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Flag className="h-3 w-5 shrink-0 rounded-[2px]" />
                  {t(LABEL_KEY[lang])}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
